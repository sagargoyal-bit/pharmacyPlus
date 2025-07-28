import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
    try {
        console.log('🔧 Setting up basic database data...')

        // Check if medicine categories exist
        const { data: categories, error: catError } = await supabase
            .from('medicine_categories')
            .select('*')

        if (catError) {
            return NextResponse.json({
                error: 'Database schema not ready',
                details: catError.message,
                message: 'Please run the database schema first (supabase_schema_fixed.sql)'
            }, { status: 400 })
        }

        // Add medicine categories if empty
        if (categories.length === 0) {
            console.log('Adding medicine categories...')
            const { error: insertCatError } = await supabase
                .from('medicine_categories')
                .insert([
                    { name: 'Analgesics', description: 'Pain relievers' },
                    { name: 'Antibiotics', description: 'Anti-bacterial medicines' },
                    { name: 'Vitamins', description: 'Vitamin supplements' },
                    { name: 'Antacids', description: 'Stomach acid reducers' },
                    { name: 'Cough & Cold', description: 'Cold and cough medicines' }
                ])

            if (insertCatError) {
                console.error('Failed to insert categories:', insertCatError)
            } else {
                console.log('✅ Medicine categories added')
            }
        }

        // Add some basic medicines
        const { data: medicines } = await supabase
            .from('medicines')
            .select('*')

        if (medicines && medicines.length === 0) {
            console.log('Adding basic medicines...')

            // Get category IDs
            const { data: analgesicCat } = await supabase
                .from('medicine_categories')
                .select('id')
                .eq('name', 'Analgesics')
                .single()

            if (analgesicCat) {
                const { error: medError } = await supabase
                    .from('medicines')
                    .insert([
                        {
                            name: 'Paracetamol',
                            generic_name: 'Paracetamol',
                            manufacturer: 'GSK',
                            category_id: analgesicCat.id,
                            strength: '650mg',
                            unit_type: 'strips',
                            prescription_required: false,
                            is_active: true
                        },
                        {
                            name: 'Ibuprofen',
                            generic_name: 'Ibuprofen',
                            manufacturer: 'Abbott',
                            category_id: analgesicCat.id,
                            strength: '400mg',
                            unit_type: 'strips',
                            prescription_required: false,
                            is_active: true
                        }
                    ])

                if (medError) {
                    console.error('Failed to insert medicines:', medError)
                } else {
                    console.log('✅ Basic medicines added')
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Database setup completed',
            data: {
                categories: categories.length,
                medicines: medicines?.length || 0
            }
        })

    } catch (error) {
        console.error('Setup error:', error)
        return NextResponse.json({
            error: 'Setup failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 