import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        // Get the first pharmacy
        const { data: pharmacy } = await supabase
            .from('pharmacies')
            .select('id')
            .limit(1)
            .single()

        if (!pharmacy) {
            return NextResponse.json({
                todaysPurchases: 0,
                thisMonth: 0,
                totalEntries: 0,
                differentSuppliers: 0,
                recentPurchases: []
            })
        }

        // Get today's purchases total - only include purchases with items
        const today = new Date().toISOString().split('T')[0]
        const { data: todaysPurchases } = await supabase
            .from('purchases')
            .select(`
                total_amount,
                purchase_items(id)
            `)
            .eq('pharmacy_id', pharmacy.id)
            .eq('purchase_date', today)

        // Only count purchases that have items
        const todaysPurchasesTotal = todaysPurchases
            ?.filter(p => p.purchase_items && p.purchase_items.length > 0)
            ?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0

        // Get this month's purchases total - only include purchases with items
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        const startOfMonthString = startOfMonth.toISOString().split('T')[0]

        const { data: thisMonthPurchases } = await supabase
            .from('purchases')
            .select(`
                total_amount,
                purchase_items(id)
            `)
            .eq('pharmacy_id', pharmacy.id)
            .gte('purchase_date', startOfMonthString)

        // Only count purchases that have items
        const thisMonthTotal = thisMonthPurchases
            ?.filter(p => p.purchase_items && p.purchase_items.length > 0)
            ?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0

        // Get total purchase entries count - only count purchases with items
        const { data: allPurchases } = await supabase
            .from('purchases')
            .select(`
                id,
                purchase_items(id)
            `)
            .eq('pharmacy_id', pharmacy.id)

        const totalEntries = allPurchases
            ?.filter(p => p.purchase_items && p.purchase_items.length > 0)
            ?.length || 0

        // Get unique suppliers count - only count suppliers from purchases with items
        const { data: suppliersData } = await supabase
            .from('purchases')
            .select(`
                supplier_id,
                purchase_items(id)
            `)
            .eq('pharmacy_id', pharmacy.id)

        const uniqueSuppliers = new Set(
            suppliersData
                ?.filter(p => p.purchase_items && p.purchase_items.length > 0)
                ?.map(p => p.supplier_id) || []
        ).size

        // Get recent purchases with details
        const { data: recentPurchases } = await supabase
            .from('purchases')
            .select(`
        id,
        invoice_number,
        purchase_date,
        total_amount,
        suppliers(name),
        purchase_items(
          quantity,
          mrp,
          purchase_rate,
          medicines(name, generic_name)
        )
      `)
            .eq('pharmacy_id', pharmacy.id)
            .order('created_at', { ascending: false })
            .limit(10)

        // Format recent purchases for display
        const formattedRecentPurchases = recentPurchases
            ?.filter(purchase => purchase.purchase_items && purchase.purchase_items.length > 0) // Filter out purchases with no items
            ?.map(purchase => {
                const firstItem = purchase.purchase_items?.[0]
                const totalQuantity = purchase.purchase_items?.reduce((sum, item) => sum + item.quantity, 0) || 0

                return {
                    id: purchase.id,
                    medicine_name: (firstItem?.medicines as any)?.name || 'Multiple Items',
                    supplier: (purchase.suppliers as any)?.name || 'Unknown',
                    quantity: totalQuantity,
                    rate: firstItem?.purchase_rate || 0,
                    mrp: firstItem?.mrp || 0,
                    expiry_date: '2025-12-31', // We'll need to get this from purchase_items if needed
                    total: purchase.total_amount || 0,
                    purchase_date: purchase.purchase_date,
                    items_count: purchase.purchase_items?.length || 0
                }
            }) || []

        console.log('📊 Purchases stats:', {
            todaysPurchases: todaysPurchasesTotal,
            thisMonth: thisMonthTotal,
            totalEntries: totalEntries || 0,
            differentSuppliers: uniqueSuppliers,
            recentPurchasesCount: formattedRecentPurchases.length
        })

        return NextResponse.json({
            todaysPurchases: todaysPurchasesTotal,
            thisMonth: thisMonthTotal,
            totalEntries: totalEntries || 0,
            differentSuppliers: uniqueSuppliers,
            recentPurchases: formattedRecentPurchases
        })

    } catch (error) {
        console.error('Purchases stats error:', error)
        return NextResponse.json({
            error: 'Failed to fetch purchases stats',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 