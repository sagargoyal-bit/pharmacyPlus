import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        console.log('🔍 Testing Supabase Connection...')

        // Test 1: Check environment variables
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        console.log('Environment Variables:')
        console.log('- SUPABASE_URL:', url ? '✅ Set' : '❌ Missing')
        console.log('- SUPABASE_KEY:', key ? '✅ Set' : '❌ Missing')

        // Test 2: Basic connection test
        const { data: connectionTest, error: connectionError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1)

        console.log('Basic Connection Test:', connectionTest)
        if (connectionError) {
            console.log('❌ Connection failed:', connectionError.message)
        } else {
            console.log('✅ Connection successful')
        }

        // Test 3: Check auth.users (requires service role key)
        console.log('Checking auth.users...')
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

        console.log('Auth Users:')
        if (authError) {
            console.log('❌ Auth users query failed:', authError.message)
            console.log('   This is normal if you are using anon key (need service role key for auth.users)')
        } else {
            console.log(`✅ Found ${authUsers.users?.length || 0} auth users`)
            authUsers.users?.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`)
            })
        }

        // Test 4: Check public.users table
        console.log('Checking public.users table...')
        const { data: publicUsers, error: publicError } = await supabase
            .from('users')
            .select('*')

        console.log('Public Users:')
        if (publicError) {
            console.log('❌ Public users query failed:', publicError.message)
            if (publicError.code === '42P01') {
                console.log('   The "users" table does not exist. You need to run the database schema first.')
            }
        } else {
            console.log(`✅ Found ${publicUsers?.length || 0} public users`)
            publicUsers?.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`)
            })
        }

        // Test 5: Check other tables
        const tables = ['pharmacies', 'suppliers', 'medicines', 'medicine_categories']

        for (const tableName of tables) {
            const { data, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact' })
                .limit(0)

            if (error) {
                console.log(`❌ Table "${tableName}": ${error.message}`)
            } else {
                console.log(`✅ Table "${tableName}": ${data?.length || 0} records`)
            }
        }

        // Return summary
        return NextResponse.json({
            status: 'Connection test completed',
            environment: {
                url: url ? 'Set' : 'Missing',
                key: key ? 'Set' : 'Missing'
            },
            connection: connectionError ? 'Failed' : 'Success',
            authUsers: authError ? 'Failed to query' : (authUsers?.users?.length || 0),
            publicUsers: publicError ? 'Failed to query' : (publicUsers?.length || 0),
            tables: {
                pharmacies: 'Check console for details',
                suppliers: 'Check console for details',
                medicines: 'Check console for details',
                medicine_categories: 'Check console for details'
            },
            message: 'Check server console for detailed logs'
        })

    } catch (error) {
        console.error('❌ Test failed with exception:', error)
        return NextResponse.json({
            status: 'Test failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Check server console for detailed logs'
        }, { status: 500 })
    }
} 