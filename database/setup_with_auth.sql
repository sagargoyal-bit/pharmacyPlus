-- ===============================================
-- COMPLETE SETUP WITH SUPABASE AUTHENTICATION
-- Step-by-step guide to set up your pharmacy database
-- ===============================================

-- ===============================================
-- STEP 1: SETUP AUTHENTICATION USERS
-- ===============================================

-- You CANNOT run these SQL commands directly in the SQL editor
-- These are just for reference - use the methods below instead

-- METHOD A: Create users through Supabase Dashboard (RECOMMENDED)
/*
1. Go to your Supabase Dashboard
2. Navigate to Authentication → Users
3. Click "Add user" 
4. Create these users one by one:

   User 1:
   - Email: admin@medplus.com
   - Password: (choose a secure password)
   - Email Confirmed: Yes
   
   User 2: 
   - Email: pharmacist@medplus.com
   - Password: (choose a secure password)
   - Email Confirmed: Yes
   
   User 3:
   - Email: staff@medplus.com  
   - Password: (choose a secure password)
   - Email Confirmed: Yes

5. After creating each user, copy their UUID from the dashboard
6. Replace the UUIDs in the queries below
*/

-- METHOD B: Create users programmatically (if you have service role key)
/*
You can create users through your Next.js API or directly with supabase-js:

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key needed
)

const { data: user1, error } = await supabase.auth.admin.createUser({
  email: 'admin@medplus.com',
  password: 'your_secure_password',
  email_confirm: true,
  user_metadata: {
    full_name: 'Dr. Rajesh Sharma'
  }
})
*/

-- ===============================================
-- STEP 2: GET ACTUAL USER IDs
-- ===============================================

-- After creating users, get their UUIDs by running this query:
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Copy the UUIDs and replace them in the sample data below

-- ===============================================
-- STEP 3: INSERT USER PROFILES
-- ===============================================

-- Example: Replace these with actual UUIDs from Step 2
-- These are just placeholders - USE YOUR ACTUAL UUIDs

-- Example UUIDs (REPLACE WITH ACTUAL ONES):
-- Admin user UUID:      a1b2c3d4-e5f6-7890-abcd-ef1234567890
-- Pharmacist UUID:      b2c3d4e5-f6g7-8901-bcde-f23456789012  
-- Staff user UUID:      c3d4e5f6-g7h8-9012-cdef-345678901234

INSERT INTO public.users (id, email, full_name, phone, role) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@medplus.com', 'Dr. Rajesh Sharma', '+91-9876543210', 'admin'),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'pharmacist@medplus.com', 'Priya Patel', '+91-9876543211', 'pharmacist'),
('c3d4e5f6-g7h8-9012-cdef-345678901234', 'staff@medplus.com', 'Amit Kumar', '+91-9876543212', 'staff');

-- ===============================================
-- STEP 4: CREATE PHARMACY
-- ===============================================

INSERT INTO public.pharmacies (id, name, license_number, gst_number, address, city, state, pincode, phone, email, owner_id) VALUES
('pharmacy-uuid-001', 'MedPlus Pharmacy', 'MP/DL/2024/001', '27ABCDE1234F1Z5', '123 Main Street, Medical Complex', 'Mumbai', 'Maharashtra', '400001', '+91-22-12345678', 'info@medplus.com', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- ===============================================
-- STEP 5: LINK USERS TO PHARMACY
-- ===============================================

INSERT INTO public.user_pharmacies (user_id, pharmacy_id, role) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'pharmacy-uuid-001', 'owner'),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'pharmacy-uuid-001', 'pharmacist'),
('c3d4e5f6-g7h8-9012-cdef-345678901234', 'pharmacy-uuid-001', 'staff');

-- ===============================================
-- STEP 6: ADD SUPPLIERS
-- ===============================================

INSERT INTO public.suppliers (pharmacy_id, name, contact_person, phone, email, address, city, state, gst_number, drug_license_number, credit_days) VALUES
('pharmacy-uuid-001', 'MedSource Distributors', 'Rahul Singh', '+91-11-12345678', 'rahul@medsource.com', '456 Industrial Area', 'Delhi', 'Delhi', '07ABCDE5678G1Z9', 'DL/DS/2024/001', 30),
('pharmacy-uuid-001', 'HealthCare Supplies', 'Sunita Agarwal', '+91-80-87654321', 'sunita@healthcare.com', '789 Pharma Hub', 'Bangalore', 'Karnataka', '29FGHIJ9012K3L6', 'KA/HC/2024/002', 45),
('pharmacy-uuid-001', 'PharmaCorp Ltd', 'Vikash Gupta', '+91-40-11111111', 'vikash@pharmacorp.com', '321 Business District', 'Hyderabad', 'Telangana', '36MNOPQ3456R7S8', 'TS/PC/2024/003', 60);

-- ===============================================
-- STEP 7: ADD SAMPLE MEDICINES
-- ===============================================

INSERT INTO public.medicines (name, generic_name, brand_name, manufacturer, category_id, composition, strength, dosage_form, pack_size, unit_type, hsn_code, prescription_required) VALUES
('Paracetamol', 'Paracetamol', 'Crocin', 'GSK', (SELECT id FROM medicine_categories WHERE name = 'Analgesics'), 'Paracetamol IP', '650mg', 'Tablet', '10x10', 'strips', '3004', false),
('Amoxicillin', 'Amoxicillin', 'Amoxil', 'Cipla', (SELECT id FROM medicine_categories WHERE name = 'Antibiotics'), 'Amoxicillin Trihydrate', '500mg', 'Capsule', '10x10', 'strips', '3004', true),
('Ibuprofen', 'Ibuprofen', 'Brufen', 'Abbott', (SELECT id FROM medicine_categories WHERE name = 'Analgesics'), 'Ibuprofen IP', '400mg', 'Tablet', '10x10', 'strips', '3004', false),
('Azithromycin', 'Azithromycin', 'Azee', 'Cipla', (SELECT id FROM medicine_categories WHERE name = 'Antibiotics'), 'Azithromycin Dihydrate', '500mg', 'Tablet', '1x3', 'strips', '3004', true),
('Cetrizine', 'Cetrizine', 'Zyrtec', 'UCB', (SELECT id FROM medicine_categories WHERE name = 'Cough & Cold'), 'Cetrizine Hydrochloride', '10mg', 'Tablet', '10x10', 'strips', '3004', false);

-- ===============================================
-- STEP 8: ADD SAMPLE PURCHASES
-- ===============================================

INSERT INTO public.purchases (pharmacy_id, supplier_id, user_id, invoice_number, invoice_date, purchase_date, total_amount) VALUES
('pharmacy-uuid-001', 
 (SELECT id FROM suppliers WHERE name = 'MedSource Distributors'), 
 'b2c3d4e5-f6g7-8901-bcde-f23456789012', -- pharmacist user
 'MS/2024/001', '2024-01-15', '2024-01-15', 15750.00);

-- ===============================================
-- STEP 9: ADD SAMPLE PURCHASE ITEMS
-- ===============================================

INSERT INTO public.purchase_items (purchase_id, medicine_id, batch_number, expiry_date, quantity, mrp, purchase_rate) VALUES
((SELECT id FROM purchases WHERE invoice_number = 'MS/2024/001'), 
 (SELECT id FROM medicines WHERE name = 'Paracetamol'), 'PAR001', '2025-12-31', 100, 10.50, 8.50),
((SELECT id FROM purchases WHERE invoice_number = 'MS/2024/001'), 
 (SELECT id FROM medicines WHERE name = 'Ibuprofen'), 'IBU001', '2025-11-30', 50, 25.00, 20.00);

-- ===============================================
-- STEP 10: ADD PHARMACY SETTINGS
-- ===============================================

INSERT INTO public.pharmacy_settings (pharmacy_id, low_stock_threshold, expiry_alert_days, default_markup_percentage, default_tax_percentage) VALUES
('pharmacy-uuid-001', 15, 90, 25.0, 12.0);

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Check if everything was created correctly:

-- 1. Check users
SELECT u.email, u.full_name, u.role, au.created_at 
FROM public.users u 
JOIN auth.users au ON u.id = au.id;

-- 2. Check pharmacy and user relationships
SELECT p.name as pharmacy_name, u.email, up.role 
FROM public.pharmacies p
JOIN public.user_pharmacies up ON p.id = up.pharmacy_id
JOIN public.users u ON up.user_id = u.id;

-- 3. Check suppliers
SELECT name, contact_person, city, state FROM public.suppliers;

-- 4. Check medicines
SELECT m.name, m.manufacturer, mc.name as category 
FROM public.medicines m
LEFT JOIN public.medicine_categories mc ON m.category_id = mc.id;

-- 5. Check purchases
SELECT p.invoice_number, p.purchase_date, s.name as supplier, u.email as created_by
FROM public.purchases p
JOIN public.suppliers s ON p.supplier_id = s.id
JOIN public.users u ON p.user_id = u.id;

-- 6. Check inventory was created automatically
SELECT ci.current_stock, m.name as medicine_name, ci.batch_number, ci.expiry_date
FROM public.current_inventory ci
JOIN public.medicines m ON ci.medicine_id = m.id;

-- ===============================================
-- TROUBLESHOOTING
-- ===============================================

/*
Common Issues:

1. "foreign key constraint violation"
   → Make sure you created auth users first
   → Check UUIDs are correct

2. "relation does not exist"  
   → Run the main schema first (supabase_schema_fixed.sql)
   → Make sure all tables are created

3. "permission denied"
   → Make sure you're running as project owner
   → Check RLS policies are set correctly

4. "duplicate key value"
   → Some data might already exist
   → Try SELECT queries first to check existing data
*/ 