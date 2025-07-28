-- ===============================================
-- MINIMAL TEST DATA (NO USER DEPENDENCIES)
-- Use this for basic testing without creating auth users
-- ===============================================

-- This file contains sample data that doesn't require auth users
-- Perfect for testing the database structure and triggers

-- ===============================================
-- 1. MEDICINE CATEGORIES (Already created by main schema)
-- ===============================================

-- Categories are already inserted by the main schema
-- Verify they exist:
SELECT * FROM public.medicine_categories ORDER BY name;

-- ===============================================
-- 2. SAMPLE MEDICINES (SAFE TO RUN)
-- ===============================================

INSERT INTO public.medicines (name, generic_name, brand_name, manufacturer, category_id, composition, strength, dosage_form, pack_size, unit_type, hsn_code, prescription_required) VALUES
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
-- 3. TEST QUERIES TO VERIFY STRUCTURE
-- ===============================================

-- Check medicine categories
SELECT 
    mc.name as category,
    COUNT(m.id) as medicine_count
FROM public.medicine_categories mc
LEFT JOIN public.medicines m ON mc.id = m.category_id
GROUP BY mc.id, mc.name
ORDER BY mc.name;

-- Check medicines by category
SELECT 
    m.name as medicine_name,
    m.manufacturer,
    m.strength,
    mc.name as category,
    m.prescription_required
FROM public.medicines m
LEFT JOIN public.medicine_categories mc ON m.category_id = mc.id
ORDER BY mc.name, m.name;

-- Search function test
SELECT * FROM search_medicines('para');

-- ===============================================
-- 4. TEST CALCULATED FIELDS (PURCHASE ITEMS)
-- ===============================================

-- This tests the trigger-based calculations
-- Note: This will fail if you don't have users/pharmacy/suppliers set up
-- But it shows how the calculations work

/*
-- Example purchase item to test calculations
INSERT INTO public.purchase_items (
    purchase_id, medicine_id, batch_number, expiry_date,
    quantity, free_quantity, purchase_rate, discount_percentage, tax_percentage, mrp
) VALUES (
    gen_random_uuid(), -- This will fail without a real purchase_id
    (SELECT id FROM medicines WHERE name = 'Paracetamol'),
    'TEST001', '2025-12-31',
    100, 10, 8.50, 10.0, 12.0, 10.50
);

-- Expected calculations:
-- total_quantity = 100 + 10 = 110
-- gross_amount = 100 * 8.50 = 850.00
-- discount_amount = 850.00 * 10% = 85.00  
-- taxable_amount = 850.00 - 85.00 = 765.00
-- tax_amount = 765.00 * 12% = 91.80
-- net_amount = 765.00 + 91.80 = 856.80
*/

-- ===============================================
-- 5. VERIFICATION QUERIES
-- ===============================================

-- Count tables content
SELECT 
    'medicine_categories' as table_name, 
    COUNT(*) as row_count 
FROM public.medicine_categories
UNION ALL
SELECT 
    'medicines' as table_name, 
    COUNT(*) as row_count 
FROM public.medicines
UNION ALL
SELECT 
    'users' as table_name, 
    COUNT(*) as row_count 
FROM public.users
UNION ALL
SELECT 
    'pharmacies' as table_name, 
    COUNT(*) as row_count 
FROM public.pharmacies
UNION ALL
SELECT 
    'suppliers' as table_name, 
    COUNT(*) as row_count 
FROM public.suppliers
UNION ALL
SELECT 
    'purchases' as table_name, 
    COUNT(*) as row_count 
FROM public.purchases
UNION ALL
SELECT 
    'purchase_items' as table_name, 
    COUNT(*) as row_count 
FROM public.purchase_items
UNION ALL
SELECT 
    'current_inventory' as table_name, 
    COUNT(*) as row_count 
FROM public.current_inventory;

-- Check which functions are available
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ===============================================
-- NOTES
-- ===============================================

/*
This minimal dataset includes:
✅ Medicine categories (15 categories)
✅ Sample medicines (10 medicines) 
✅ Tests for search functions
✅ Verification queries

What's NOT included (requires auth users):
❌ Users and pharmacies
❌ Suppliers  
❌ Purchases and purchase items
❌ Inventory data

To get the full dataset working:
1. Create auth users first (see setup_with_auth.sql)
2. Get their actual UUIDs  
3. Use sample_data_fixed.sql with real UUIDs

This file is perfect for:
- Testing the database structure
- Verifying medicine data
- Testing search functions  
- Confirming triggers and functions work
- Development and debugging
*/ 