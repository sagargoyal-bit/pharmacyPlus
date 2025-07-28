-- ===============================================
-- SAMPLE DATA FOR PHARMACY INVENTORY SYSTEM
-- ===============================================

-- Sample Users (these will be created through Supabase Auth)
-- You'll need to insert these after users sign up
INSERT INTO public.users (id, email, full_name, phone, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@medplus.com', 'Dr. Rajesh Sharma', '+91-9876543210', 'admin'),
('550e8400-e29b-41d4-a716-446655440002', 'pharmacist@medplus.com', 'Priya Patel', '+91-9876543211', 'pharmacist'),
('550e8400-e29b-41d4-a716-446655440003', 'staff@medplus.com', 'Amit Kumar', '+91-9876543212', 'staff');

-- Sample Pharmacy
INSERT INTO public.pharmacies (id, name, license_number, gst_number, address, city, state, pincode, phone, email, owner_id) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'MedPlus Pharmacy', 'MP/DL/2024/001', '27ABCDE1234F1Z5', '123 Main Street, Medical Complex', 'Mumbai', 'Maharashtra', '400001', '+91-22-12345678', 'info@medplus.com', '550e8400-e29b-41d4-a716-446655440001');

-- User-Pharmacy relationships
INSERT INTO public.user_pharmacies (user_id, pharmacy_id, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'owner'),
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'pharmacist'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'staff');

-- Sample Suppliers
INSERT INTO public.suppliers (pharmacy_id, name, contact_person, phone, email, address, city, state, gst_number, drug_license_number, credit_days) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'MedSource Distributors', 'Rahul Singh', '+91-11-12345678', 'rahul@medsource.com', '456 Industrial Area', 'Delhi', 'Delhi', '07ABCDE5678G1Z9', 'DL/DS/2024/001', 30),
('660e8400-e29b-41d4-a716-446655440001', 'HealthCare Supplies', 'Sunita Agarwal', '+91-80-87654321', 'sunita@healthcare.com', '789 Pharma Hub', 'Bangalore', 'Karnataka', '29FGHIJ9012K3L6', 'KA/HC/2024/002', 45),
('660e8400-e29b-41d4-a716-446655440001', 'PharmaCorp Ltd', 'Vikash Gupta', '+91-40-11111111', 'vikash@pharmacorp.com', '321 Business District', 'Hyderabad', 'Telangana', '36MNOPQ3456R7S8', 'TS/PC/2024/003', 60);

-- Sample Medicines
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

-- Sample Purchases
INSERT INTO public.purchases (pharmacy_id, supplier_id, user_id, invoice_number, invoice_date, purchase_date, total_amount) VALUES
('660e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM suppliers WHERE name = 'MedSource Distributors'), 
 '550e8400-e29b-41d4-a716-446655440002', 
 'MS/2024/001', '2024-01-15', '2024-01-15', 15750.00),
('660e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM suppliers WHERE name = 'HealthCare Supplies'), 
 '550e8400-e29b-41d4-a716-446655440002', 
 'HC/2024/001', '2024-01-16', '2024-01-16', 8920.00),
('660e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM suppliers WHERE name = 'PharmaCorp Ltd'), 
 '550e8400-e29b-41d4-a716-446655440001', 
 'PC/2024/001', '2024-01-17', '2024-01-17', 12340.00);

-- Sample Purchase Items
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

-- Sample Pharmacy Settings
INSERT INTO public.pharmacy_settings (pharmacy_id, low_stock_threshold, expiry_alert_days, default_markup_percentage, default_tax_percentage) VALUES
('660e8400-e29b-41d4-a716-446655440001', 15, 90, 25.0, 12.0);

-- Note: Current inventory, stock transactions, and expiry alerts will be automatically created by triggers when purchase items are inserted 