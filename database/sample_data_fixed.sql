-- ===============================================
-- SAMPLE DATA FOR PHARMACY INVENTORY SYSTEM (FIXED)
-- ===============================================

-- IMPORTANT: Before running this, you need to create actual users through Supabase authentication system
-- This file provides the structure - you'll need to replace UUIDs with actual user IDs

-- ===============================================
-- STEP 1: CREATE USERS THROUGH SUPABASE AUTH FIRST
-- ===============================================

-- You cannot directly insert into auth.users table
-- Instead, create users through Supabase Dashboard or Auth API
-- Here's how to do it:

/*
METHOD 1: Through Supabase Dashboard
1. Go to Authentication → Users in your Supabase dashboard
2. Click "Add user"
3. Create these users:
   - admin@medplus.com (password: your_choice)
   - pharmacist@medplus.com (password: your_choice)  
   - staff@medplus.com (password: your_choice)
4. Note down the generated UUIDs
5. Replace the UUIDs below with the actual ones

METHOD 2: Through Auth API (programmatically)
-- You can use supabase.auth.admin.createUser() in your application
*/

-- ===============================================
-- STEP 2: INSERT USER PROFILES (AFTER AUTH USERS EXIST)
-- ===============================================

-- Replace these UUIDs with actual user IDs from Supabase Auth
-- You can get them from: Authentication → Users in Supabase Dashboard

INSERT INTO public.users (id, email, full_name, phone, role) VALUES
-- Replace with actual UUID from Supabase Auth user #1
('REPLACE_WITH_ACTUAL_ADMIN_UUID', 'admin@medplus.com', 'Dr. Rajesh Sharma', '+91-9876543210', 'admin'),
-- Replace with actual UUID from Supabase Auth user #2  
('REPLACE_WITH_ACTUAL_PHARMACIST_UUID', 'pharmacist@medplus.com', 'Priya Patel', '+91-9876543211', 'pharmacist'),
-- Replace with actual UUID from Supabase Auth user #3
('REPLACE_WITH_ACTUAL_STAFF_UUID', 'staff@medplus.com', 'Amit Kumar', '+91-9876543212', 'staff');

-- ===============================================
-- STEP 3: CREATE PHARMACY
-- ===============================================

INSERT INTO public.pharmacies (id, name, license_number, gst_number, address, city, state, pincode, phone, email, owner_id) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'MedPlus Pharmacy', 'MP/DL/2024/001', '27ABCDE1234F1Z5', '123 Main Street, Medical Complex', 'Mumbai', 'Maharashtra', '400001', '+91-22-12345678', 'info@medplus.com', 'REPLACE_WITH_ACTUAL_ADMIN_UUID');

-- ===============================================
-- STEP 4: CREATE USER-PHARMACY RELATIONSHIPS
-- ===============================================

INSERT INTO public.user_pharmacies (user_id, pharmacy_id, role) VALUES
('REPLACE_WITH_ACTUAL_ADMIN_UUID', '660e8400-e29b-41d4-a716-446655440001', 'owner'),
('REPLACE_WITH_ACTUAL_PHARMACIST_UUID', '660e8400-e29b-41d4-a716-446655440001', 'pharmacist'),
('REPLACE_WITH_ACTUAL_STAFF_UUID', '660e8400-e29b-41d4-a716-446655440001', 'staff');

-- ===============================================
-- STEP 5: SAMPLE SUPPLIERS (SAFE TO RUN AS-IS)
-- ===============================================

INSERT INTO public.suppliers (pharmacy_id, name, contact_person, phone, email, address, city, state, gst_number, drug_license_number, credit_days) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'MedSource Distributors', 'Rahul Singh', '+91-11-12345678', 'rahul@medsource.com', '456 Industrial Area', 'Delhi', 'Delhi', '07ABCDE5678G1Z9', 'DL/DS/2024/001', 30),
('660e8400-e29b-41d4-a716-446655440001', 'HealthCare Supplies', 'Sunita Agarwal', '+91-80-87654321', 'sunita@healthcare.com', '789 Pharma Hub', 'Bangalore', 'Karnataka', '29FGHIJ9012K3L6', 'KA/HC/2024/002', 45),
('660e8400-e29b-41d4-a716-446655440001', 'PharmaCorp Ltd', 'Vikash Gupta', '+91-40-11111111', 'vikash@pharmacorp.com', '321 Business District', 'Hyderabad', 'Telangana', '36MNOPQ3456R7S8', 'TS/PC/2024/003', 60);

-- ===============================================
-- STEP 6: SAMPLE MEDICINES (SAFE TO RUN AS-IS)
-- ===============================================

INSERT INTO public.medicines (name, generic_name, brand_name, manufacturer, category_id, composition, strength, dosage_form, pack_size, unit_type, hsn_code, prescription_required) VALUES
-- Get category IDs first
('Paracetamol', 'Paracetamol', 'Crocin', 'GSK', (SELECT id FROM medicine_categories WHERE name = 'Analgesics'), 'Paracetamol IP', '650mg', 'Tablet', '10x10', 'strips', '3004', false),
('Amoxicillin', 'Amoxicillin', 'Amoxil', 'Cipla', (SELECT id FROM medicine_categories WHERE name = 'Antibiotics'), 'Amoxicillin Trihydrate', '500mg', 'Capsule', '10x10', 'strips', '3004', true),
('Ibuprofen', 'Ibuprofen', 'Brufen', 'Abbott', (SELECT id FROM medicine_categories WHERE name = 'Analgesics'), 'Ibuprofen IP', '400mg', 'Tablet', '10x10', 'strips', '3004', false),
('Azithromycin', 'Azithromycin', 'Azee', 'Cipla', (SELECT id FROM medicine_categories WHERE name = 'Antibiotics'), 'Azithromycin Dihydrate', '500mg', 'Tablet', '1x3', 'strips', '3004', true),
('Cetrizine', 'Cetrizine', 'Zyrtec', 'UCB', (SELECT id FROM medicine_categories WHERE name = 'Cough & Cold'), 'Cetrizine Hydrochloride', '10mg', 'Tablet', '10x10', 'strips', '3004', false),
('Vitamin D3', 'Cholecalciferol', 'Calcirol', 'Cadila', (SELECT id FROM medicine_categories WHERE name = 'Vitamins'), 'Cholecalciferol', '60000 IU', 'Capsule', '1x4', 'strips', '3003', false),
('Omeprazole', 'Omeprazole', 'Omez', 'Dr. Reddy''s', (SELECT id FROM medicine_categories WHERE name = 'Antacids'), 'Omeprazole Magnesium', '20mg', 'Capsule', '10x10', 'strips', '3004', false),
('Metformin', 'Metformin', 'Glycomet', 'USV', (SELECT id FROM medicine_categories WHERE name = 'Diabetes'), 'Metformin Hydrochloride', '500mg', 'Tablet', '10x10', 'strips', '3004', true),
('Amlodipine', 'Amlodipine', 'Amlong', 'Micro Labs', (SELECT id FROM medicine_categories WHERE name = 'Hypertension'), 'Amlodipine Besylate', '5mg', 'Tablet', '10x10', 'strips', '3004', true),
('Cough Syrup', 'Dextromethorphan', 'Benadryl', 'Johnson & Johnson', (SELECT id FROM medicine_categories WHERE name = 'Cough & Cold'), 'Dextromethorphan HBr', '15mg/5ml', 'Syrup', '100ml', 'bottles', '3003', false);

-- ===============================================
-- STEP 7: SAMPLE PURCHASES (REPLACE USER UUIDs)
-- ===============================================

INSERT INTO public.purchases (pharmacy_id, supplier_id, user_id, invoice_number, invoice_date, purchase_date, total_amount) VALUES
('660e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM suppliers WHERE name = 'MedSource Distributors'), 
 'REPLACE_WITH_ACTUAL_PHARMACIST_UUID', 
 'MS/2024/001', '2024-01-15', '2024-01-15', 15750.00),
('660e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM suppliers WHERE name = 'HealthCare Supplies'), 
 'REPLACE_WITH_ACTUAL_PHARMACIST_UUID', 
 'HC/2024/001', '2024-01-16', '2024-01-16', 8920.00),
('660e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM suppliers WHERE name = 'PharmaCorp Ltd'), 
 'REPLACE_WITH_ACTUAL_ADMIN_UUID', 
 'PC/2024/001', '2024-01-17', '2024-01-17', 12340.00);

-- ===============================================
-- STEP 8: SAMPLE PURCHASE ITEMS (SAFE TO RUN AS-IS)
-- ===============================================

INSERT INTO public.purchase_items (purchase_id, medicine_id, batch_number, expiry_date, quantity, mrp, purchase_rate) VALUES
-- Purchase 1 items
((SELECT id FROM purchases WHERE invoice_number = 'MS/2024/001'), 
 (SELECT id FROM medicines WHERE name = 'Paracetamol'), 'PAR001', '2025-12-31', 100, 10.50, 8.50),
((SELECT id FROM purchases WHERE invoice_number = 'MS/2024/001'), 
 (SELECT id FROM medicines WHERE name = 'Ibuprofen'), 'IBU001', '2025-11-30', 50, 25.00, 20.00),
((SELECT id FROM purchases WHERE invoice_number = 'MS/2024/001'), 
 (SELECT id FROM medicines WHERE name = 'Cetrizine'), 'CET001', '2025-10-31', 75, 12.00, 9.50),

-- Purchase 2 items
((SELECT id FROM purchases WHERE invoice_number = 'HC/2024/001'), 
 (SELECT id FROM medicines WHERE name = 'Amoxicillin'), 'AMX001', '2025-09-30', 60, 45.00, 36.00),
((SELECT id FROM purchases WHERE invoice_number = 'HC/2024/001'), 
 (SELECT id FROM medicines WHERE name = 'Azithromycin'), 'AZE001', '2025-08-31', 40, 85.00, 68.00),

-- Purchase 3 items
((SELECT id FROM purchases WHERE invoice_number = 'PC/2024/001'), 
 (SELECT id FROM medicines WHERE name = 'Vitamin D3'), 'VIT001', '2026-01-31', 80, 35.00, 28.00),
((SELECT id FROM purchases WHERE invoice_number = 'PC/2024/001'), 
 (SELECT id FROM medicines WHERE name = 'Omeprazole'), 'OME001', '2025-07-31', 90, 18.00, 14.40),
((SELECT id FROM purchases WHERE invoice_number = 'PC/2024/001'), 
 (SELECT id FROM medicines WHERE name = 'Metformin'), 'MET001', '2025-06-30', 120, 8.50, 6.80);

-- ===============================================
-- STEP 9: SAMPLE PHARMACY SETTINGS (SAFE TO RUN AS-IS)
-- ===============================================

INSERT INTO public.pharmacy_settings (pharmacy_id, low_stock_threshold, expiry_alert_days, default_markup_percentage, default_tax_percentage) VALUES
('660e8400-e29b-41d4-a716-446655440001', 15, 90, 25.0, 12.0);

-- Note: Current inventory, stock transactions, and expiry alerts will be automatically created by triggers when purchase items are inserted 