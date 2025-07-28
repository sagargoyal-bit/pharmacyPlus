import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({
                error: 'Missing environment variables',
                supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
                serviceRoleKey: serviceRoleKey ? 'Set' : 'Missing',
                message: 'Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file'
            }, { status: 400 })
        }

        // Create admin client with service role key
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Get all auth users
        const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers()

        if (error) {
            return NextResponse.json({
                error: 'Failed to fetch auth users',
                details: error.message
            }, { status: 500 })
        }

        // Format the response with user IDs and emails
        const users = authUsers.users.map((user, index) => ({
            index: index + 1,
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in: user.last_sign_in_at
        }))

        console.log('🔍 Found Auth Users:')
        users.forEach(user => {
            console.log(`   ${user.index}. ${user.email} (ID: ${user.id})`)
        })

        // Generate SQL for inserting into public.users
        const insertSQL = users.map(user =>
            `('${user.id}', '${user.email}', '${user.email?.split('@')[0] || 'User'}', '+91-1234567890', 'pharmacist')`
        ).join(',\n')

        const fullSQL = `-- Copy and run this SQL in Supabase SQL Editor:
INSERT INTO public.users (id, email, full_name, phone, role) VALUES
${insertSQL};

-- Then create a pharmacy:
INSERT INTO public.pharmacies (id, name, license_number, address, city, state, pincode, phone, owner_id) VALUES
('pharmacy-001', 'Your Pharmacy', 'LIC001', '123 Main Street', 'Mumbai', 'Maharashtra', '400001', '+91-1234567890', '${users[0]?.id}');`

        return NextResponse.json({
            success: true,
            message: `Found ${users.length} auth users`,
            users: users,
            sql: fullSQL,
            instructions: [
                '1. Copy the SQL from the "sql" field below',
                '2. Go to Supabase Dashboard → SQL Editor',
                '3. Paste and run the SQL',
                '4. Test your purchase form again'
            ]
        })

    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({
            error: 'Server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 