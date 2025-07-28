import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        // Get the first pharmacy (assuming single pharmacy setup for now)
        const { data: pharmacy } = await supabase
            .from('pharmacies')
            .select('id')
            .limit(1)
            .single()

        if (!pharmacy) {
            return NextResponse.json({
                total_medicines: 0,
                todays_purchases: 0,
                expiring_soon: 0,
                stock_value: 0,
                recent_activity: []
            })
        }

        // Get total unique medicines in stock
        const { data: medicinesCount } = await supabase
            .from('current_inventory')
            .select('medicine_id', { count: 'exact' })
            .eq('pharmacy_id', pharmacy.id)
            .gt('current_stock', 0)

        // Get today's purchases total
        const today = new Date().toISOString().split('T')[0]
        const { data: todaysPurchases } = await supabase
            .from('purchases')
            .select('total_amount')
            .eq('pharmacy_id', pharmacy.id)
            .eq('purchase_date', today)

        const todaysPurchasesTotal = todaysPurchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0

        // Get medicines expiring in 30 days
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

        const { count: expiringCount } = await supabase
            .from('current_inventory')
            .select('*', { count: 'exact' })
            .eq('pharmacy_id', pharmacy.id)
            .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
            .gt('current_stock', 0)

        // Calculate total stock value
        const { data: stockValue } = await supabase
            .from('current_inventory')
            .select('current_stock, last_purchase_rate')
            .eq('pharmacy_id', pharmacy.id)
            .gt('current_stock', 0)

        const totalStockValue = stockValue?.reduce((sum, item) => {
            return sum + (item.current_stock * (item.last_purchase_rate || 0))
        }, 0) || 0

        // Get recent activity
        const recentActivity: Array<{
            id: string
            action: string
            time: string
            type: 'purchase' | 'inventory'
        }> = []

        // Recent purchases
        const { data: recentPurchases } = await supabase
            .from('purchases')
            .select(`
        id,
        invoice_number,
        created_at,
        suppliers!inner(name),
        purchase_items!inner(
          quantity,
          medicines!inner(name)
        )
      `)
            .eq('pharmacy_id', pharmacy.id)
            .order('created_at', { ascending: false })
            .limit(3)

        recentPurchases?.forEach((purchase: any) => {
            const itemsCount = purchase.purchase_items?.reduce((sum: number, item) => sum + item.quantity, 0) || 0
            const firstMedicine = purchase.purchase_items?.[0]?.medicines?.name || 'items'

            recentActivity.push({
                id: `purchase-${purchase.id}`,
                action: `${firstMedicine} purchased (${itemsCount} units) from ${purchase.suppliers?.name || 'Unknown Supplier'}`,
                time: getRelativeTime(purchase.created_at),
                type: 'purchase'
            })
        })

        // Recent stock transactions
        const { data: recentTransactions } = await supabase
            .from('stock_transactions')
            .select(`
        id,
        transaction_type,
        quantity_in,
        created_at,
        medicines!inner(name)
      `)
            .eq('pharmacy_id', pharmacy.id)
            .order('created_at', { ascending: false })
            .limit(2)

        recentTransactions?.forEach((transaction: any) => {
            recentActivity.push({
                id: `transaction-${transaction.id}`,
                action: `${transaction.medicines?.name} stock ${transaction.transaction_type} (${transaction.quantity_in} units)`,
                time: getRelativeTime(transaction.created_at),
                type: 'inventory'
            })
        })

        // Sort activity by time and limit to 5
        recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

        const stats = {
            total_medicines: medicinesCount?.length || 0,
            todays_purchases: Math.round(todaysPurchasesTotal),
            expiring_soon: expiringCount || 0,
            stock_value: Math.round(totalStockValue),
            recent_activity: recentActivity.slice(0, 5)
        }

        return NextResponse.json(stats)
    } catch (error) {
        console.error('Dashboard stats error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats' },
            { status: 500 }
        )
    }
}

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
} 