# Supabase Database Setup - Step by Step Guide

## Prerequisites

1. **Supabase Account**: Create account at [supabase.com](https://supabase.com)
2. **New Project**: Create a new Supabase project
3. **Project Details**: Note down your project URL and API keys

## Step 1: Setup Environment Variables

Create/update your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 2: Execute Database Schema

### 2.1 Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**

### 2.2 Create Main Schema
1. Copy the entire contents of `supabase_schema.sql`
2. Paste into the SQL Editor
3. Click **Run** to execute

**Expected Output**: All tables, triggers, and policies created successfully.

## Step 3: Create Views and Functions

### 3.1 Add Utility Views
1. Create another new query in SQL Editor
2. Copy contents of `useful_views.sql`
3. Paste and click **Run**

**Expected Output**: Views and functions created for reporting and analytics.

## Step 4: Insert Sample Data (Optional)

### 4.1 Add Test Data
1. Create another new query
2. Copy contents of `sample_data.sql`
3. **Important**: Update the UUID values in the file to match your actual user IDs from Supabase Auth
4. Run the query

**Note**: You need to create actual users through Supabase Auth first, then update the UUIDs in the sample data.

## Step 5: Verify Setup

### 5.1 Check Tables Created
Run this query to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected Tables**:
- current_inventory
- expiry_alerts  
- medicine_categories
- medicines
- pharmacies
- pharmacy_settings
- purchase_items
- purchases
- stock_transactions
- suppliers
- user_pharmacies
- users

### 5.2 Check Views Created
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Views**:
- view_current_stock_summary
- view_expiry_alerts
- view_low_stock_medicines
- view_monthly_purchase_analysis
- view_outstanding_payments
- view_purchase_summary_by_supplier

### 5.3 Check Functions Created
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected Functions**:
- calculate_inventory_value
- generate_expiry_alerts
- get_dashboard_stats
- get_expiring_medicines
- get_medicine_stock
- get_purchase_statistics
- search_medicines
- update_inventory_on_purchase
- update_updated_at_column

## Step 6: Configure Authentication

### 6.1 Enable Email Authentication
1. Go to **Authentication** → **Settings**
2. Enable **Email** provider
3. Configure email templates if needed

### 6.2 Setup Row Level Security
RLS is automatically enabled by the schema. Verify by checking:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

## Step 7: Test Database Operations

### 7.1 Test Medicine Categories
```sql
SELECT * FROM medicine_categories ORDER BY name;
```

### 7.2 Test Sample Data (if inserted)
```sql
-- Check medicines
SELECT m.name, m.manufacturer, mc.name as category 
FROM medicines m
LEFT JOIN medicine_categories mc ON m.category_id = mc.id
LIMIT 5;

-- Check suppliers
SELECT name, city, state FROM suppliers LIMIT 3;
```

### 7.3 Test Functions
```sql
-- Test medicine search
SELECT * FROM search_medicines('paracetamol');

-- Test dashboard stats (replace with actual pharmacy_id)
SELECT * FROM get_dashboard_stats('660e8400-e29b-41d4-a716-446655440001');
```

## Step 8: Create First User and Pharmacy

### 8.1 Create User Through Auth
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Note the user ID (UUID)

### 8.2 Add User Profile
```sql
-- Replace the UUID with actual user ID from step 8.1
INSERT INTO public.users (id, email, full_name, phone, role) VALUES
('your-actual-user-uuid-here', 'your-email@example.com', 'Your Full Name', '+91-1234567890', 'admin');
```

### 8.3 Create Pharmacy
```sql
-- Replace user_id with actual UUID from step 8.1
INSERT INTO public.pharmacies (name, license_number, gst_number, address, city, state, pincode, phone, email, owner_id) VALUES
('Your Pharmacy Name', 'YOUR/LICENSE/2024/001', '27ABCDE1234F1Z5', 'Your Address', 'Your City', 'Your State', '123456', '+91-1234567890', 'pharmacy@example.com', 'your-actual-user-uuid-here');
```

### 8.4 Link User to Pharmacy
```sql
-- Get pharmacy_id from the previous insert
INSERT INTO public.user_pharmacies (user_id, pharmacy_id, role) VALUES
('your-actual-user-uuid-here', 'pharmacy-uuid-from-step-8.3', 'owner');
```

## Step 9: Test Application Integration

### 9.1 Update Supabase Client Configuration
Ensure your `src/lib/supabase.ts` has the correct configuration:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 9.2 Test API Endpoints
Update your API routes to use the real database:

```typescript
// Example: src/app/api/purchases/route.ts
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select(`
      *,
      suppliers(name),
      purchase_items(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(purchases)
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "permission denied for schema public"
**Solution**: Make sure you're running queries as the project owner in Supabase SQL Editor.

#### 2. "relation already exists"
**Solution**: Tables/views already created. Either drop them first or skip creation.

#### 3. "insert or update on table violates foreign key constraint"
**Solution**: 
- Ensure parent records exist before inserting child records
- Check UUID values are correct
- For sample data, create actual users in Supabase Auth first

#### 4. "row-level security policy violation"
**Solution**:
- Ensure user is properly authenticated
- Check user_pharmacies table has correct relationships
- Verify RLS policies are correctly configured

#### 5. "function does not exist"
**Solution**: Run the `useful_views.sql` file to create all functions.

### Useful Debug Queries

```sql
-- Check current user ID
SELECT auth.uid();

-- Check user pharmacy access
SELECT * FROM user_pharmacies WHERE user_id = auth.uid();

-- Check recent purchases
SELECT p.*, s.name as supplier_name 
FROM purchases p 
JOIN suppliers s ON p.supplier_id = s.id 
ORDER BY p.created_at DESC LIMIT 5;

-- Check inventory updates
SELECT * FROM stock_transactions 
ORDER BY created_at DESC LIMIT 10;
```

## Next Steps

After successful setup:

1. **Test Purchase Flow**: Create a purchase through your application
2. **Verify Inventory Updates**: Check that stock levels update automatically
3. **Test Expiry Alerts**: Verify expiry alerts are generated
4. **Configure Notifications**: Set up email/SMS notifications if needed
5. **Add More Users**: Invite additional pharmacists/staff
6. **Customize Settings**: Update pharmacy settings as needed

## Production Considerations

### Security
- [ ] Review all RLS policies
- [ ] Set up proper backup schedule
- [ ] Configure monitoring and alerts
- [ ] Set up staging environment

### Performance
- [ ] Monitor query performance
- [ ] Set up database connection pooling
- [ ] Configure read replicas if needed
- [ ] Monitor storage usage

### Compliance
- [ ] Review data retention policies
- [ ] Set up audit logging
- [ ] Configure data encryption
- [ ] Document compliance procedures

Your pharmacy inventory management database is now ready for production use! 🎉 