import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const lowStock = searchParams.get('lowStock') === 'true'
        const search = searchParams.get('search')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = (page - 1) * limit

        // Get the first pharmacy
        const { data: pharmacy } = await supabase
            .from('pharmacies')
            .select('id')
            .limit(1)
            .single()

        if (!pharmacy) {
            return NextResponse.json([])
        }

        // Use the view for current stock summary
        let query = supabase
            .from('view_current_stock_summary')
            .select('*')
            .eq('pharmacy_id', pharmacy.id)

        // Add search filter
        if (search) {
            query = query.or(`medicine_name.ilike.%${search}%,generic_name.ilike.%${search}%,manufacturer.ilike.%${search}%`)
        }

        // Add low stock filter
        if (lowStock) {
            query = query.lte('total_stock', 20) // Assuming 20 as low stock threshold
        }

        const { data: inventory, error } = await query
            .order('medicine_name', { ascending: true })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Inventory fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch inventory' },
                { status: 500 }
            )
        }

        return NextResponse.json(inventory || [])
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch inventory' },
            { status: 500 }
        )
    }
} 