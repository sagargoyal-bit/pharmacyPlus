-- ===============================================
-- PHARMACY INVENTORY MANAGEMENT SYSTEM
-- Supabase Database Schema (FIXED VERSION)
-- ===============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- 1. USERS & AUTHENTICATION
-- ===============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'pharmacist' CHECK (role IN ('admin', 'pharmacist', 'staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 2. PHARMACY/SHOP INFORMATION
-- ===============================================

-- Pharmacies table (for multi-pharmacy support)
CREATE TABLE public.pharmacies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    gst_number TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Pharmacy relationship (for multi-pharmacy access)
CREATE TABLE public.user_pharmacies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'pharmacist', 'staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, pharmacy_id)
);

-- ===============================================
-- 3. SUPPLIERS
-- ===============================================

CREATE TABLE public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    gst_number TEXT,
    drug_license_number TEXT,
    credit_days INTEGER DEFAULT 0,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 4. MEDICINE MANAGEMENT
-- ===============================================

-- Medicine Categories
CREATE TABLE public.medicine_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicines Master
CREATE TABLE public.medicines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    generic_name TEXT,
    brand_name TEXT,
    manufacturer TEXT NOT NULL,
    category_id UUID REFERENCES public.medicine_categories(id) ON DELETE SET NULL,
    composition TEXT,
    strength TEXT,
    dosage_form TEXT, -- tablet, capsule, syrup, injection, etc.
    pack_size TEXT, -- 10x10, 1x10, 100ml, etc.
    unit_type TEXT NOT NULL DEFAULT 'strips', -- strips, bottles, vials, etc.
    hsn_code TEXT,
    schedule TEXT, -- H, H1, X, etc. for drug scheduling
    prescription_required BOOLEAN DEFAULT false,
    storage_conditions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique constraint
    UNIQUE(name, manufacturer, strength)
);

-- ===============================================
-- 5. PURCHASE MANAGEMENT
-- ===============================================

-- Purchase Orders/Invoices
CREATE TABLE public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT, -- who made the purchase
    
    -- Invoice Details
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Financial Details
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    transport_charges DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Payment Details
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
    payment_terms TEXT,
    
    -- Status and Notes
    status TEXT DEFAULT 'received' CHECK (status IN ('draft', 'received', 'verified', 'cancelled')),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique constraint per pharmacy
    UNIQUE(pharmacy_id, supplier_id, invoice_number)
);

-- Purchase Items (Individual medicines in each purchase) - SIMPLIFIED VERSION
CREATE TABLE public.purchase_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE RESTRICT,
    
    -- Batch Details
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    manufacturing_date DATE,
    
    -- Quantity and Pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    free_quantity INTEGER DEFAULT 0,
    total_quantity INTEGER GENERATED ALWAYS AS (quantity + free_quantity) STORED,
    
    -- Pricing (base fields)
    mrp DECIMAL(10,2) NOT NULL,
    purchase_rate DECIMAL(10,2) NOT NULL,
    selling_rate DECIMAL(10,2), -- calculated selling price
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Financial calculations (stored as regular columns, calculated by triggers)
    gross_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    taxable_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Tracking
    received_quantity INTEGER DEFAULT 0,
    damaged_quantity INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure batch uniqueness per medicine
    UNIQUE(medicine_id, batch_number, expiry_date)
);

-- ===============================================
-- 6. INVENTORY MANAGEMENT
-- ===============================================

-- Current Inventory (Real-time stock levels)
CREATE TABLE public.current_inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    
    -- Stock Levels
    current_stock INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER DEFAULT 0,
    available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
    
    -- Reorder Management
    minimum_stock INTEGER DEFAULT 10,
    maximum_stock INTEGER DEFAULT 1000,
    reorder_level INTEGER DEFAULT 20,
    
    -- Pricing
    last_purchase_rate DECIMAL(10,2),
    current_mrp DECIMAL(10,2),
    current_selling_rate DECIMAL(10,2),
    
    -- Location
    rack_number TEXT,
    shelf_number TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint per pharmacy
    UNIQUE(pharmacy_id, medicine_id, batch_number, expiry_date)
);

-- Stock Transaction Log (All stock movements)
CREATE TABLE public.stock_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE RESTRICT,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    
    -- Transaction Details
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'return', 'adjustment', 'expired', 'damaged')),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_id UUID, -- purchase_id, sale_id, etc.
    reference_type TEXT, -- 'purchase', 'sale', 'adjustment'
    
    -- Quantity Changes
    quantity_in INTEGER DEFAULT 0,
    quantity_out INTEGER DEFAULT 0,
    net_quantity INTEGER DEFAULT 0,
    
    -- Stock Levels (before and after transaction)
    stock_before INTEGER NOT NULL,
    stock_after INTEGER DEFAULT 0,
    
    -- Financial Impact
    rate DECIMAL(10,2),
    amount DECIMAL(12,2),
    
    -- Notes and User
    notes TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 7. EXPIRY MANAGEMENT
-- ===============================================

-- Expiry Alerts Configuration
CREATE TABLE public.expiry_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    
    alert_date DATE NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('30_days', '60_days', '90_days', 'expired')),
    days_to_expiry INTEGER,
    current_stock INTEGER,
    estimated_loss DECIMAL(12,2),
    
    -- Alert Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    acknowledged_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 8. SYSTEM CONFIGURATION
-- ===============================================

-- Pharmacy Settings
CREATE TABLE public.pharmacy_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    
    -- Inventory Settings
    low_stock_threshold INTEGER DEFAULT 10,
    expiry_alert_days INTEGER DEFAULT 90,
    auto_reorder BOOLEAN DEFAULT false,
    
    -- Financial Settings
    default_markup_percentage DECIMAL(5,2) DEFAULT 20.0,
    default_tax_percentage DECIMAL(5,2) DEFAULT 12.0,
    currency TEXT DEFAULT 'INR',
    
    -- Notification Settings
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    
    -- Business Settings
    business_hours JSONB,
    backup_schedule TEXT DEFAULT 'daily',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(pharmacy_id)
);

-- ===============================================
-- 9. INDEXES FOR PERFORMANCE
-- ===============================================

-- Medicine indexes
CREATE INDEX idx_medicines_name ON public.medicines(name);
CREATE INDEX idx_medicines_generic_name ON public.medicines(generic_name);
CREATE INDEX idx_medicines_manufacturer ON public.medicines(manufacturer);
CREATE INDEX idx_medicines_category ON public.medicines(category_id);

-- Purchase indexes
CREATE INDEX idx_purchases_pharmacy ON public.purchases(pharmacy_id);
CREATE INDEX idx_purchases_supplier ON public.purchases(supplier_id);
CREATE INDEX idx_purchases_date ON public.purchases(purchase_date);
CREATE INDEX idx_purchases_status ON public.purchases(status);
CREATE INDEX idx_purchases_invoice ON public.purchases(invoice_number);

-- Purchase items indexes
CREATE INDEX idx_purchase_items_purchase ON public.purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_medicine ON public.purchase_items(medicine_id);
CREATE INDEX idx_purchase_items_expiry ON public.purchase_items(expiry_date);
CREATE INDEX idx_purchase_items_batch ON public.purchase_items(batch_number);

-- Inventory indexes
CREATE INDEX idx_current_inventory_pharmacy ON public.current_inventory(pharmacy_id);
CREATE INDEX idx_current_inventory_medicine ON public.current_inventory(medicine_id);
CREATE INDEX idx_current_inventory_expiry ON public.current_inventory(expiry_date);
CREATE INDEX idx_current_inventory_stock ON public.current_inventory(current_stock);

-- Stock transaction indexes
CREATE INDEX idx_stock_transactions_pharmacy ON public.stock_transactions(pharmacy_id);
CREATE INDEX idx_stock_transactions_medicine ON public.stock_transactions(medicine_id);
CREATE INDEX idx_stock_transactions_date ON public.stock_transactions(transaction_date);
CREATE INDEX idx_stock_transactions_type ON public.stock_transactions(transaction_type);

-- Expiry alert indexes
CREATE INDEX idx_expiry_alerts_pharmacy ON public.expiry_alerts(pharmacy_id);
CREATE INDEX idx_expiry_alerts_date ON public.expiry_alerts(expiry_date);
CREATE INDEX idx_expiry_alerts_status ON public.expiry_alerts(status);

-- ===============================================
-- 10. TRIGGERS AND FUNCTIONS
-- ===============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate purchase item amounts
CREATE OR REPLACE FUNCTION calculate_purchase_item_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate all amounts based on base fields
    NEW.gross_amount = NEW.quantity * NEW.purchase_rate;
    NEW.discount_amount = NEW.gross_amount * NEW.discount_percentage / 100;
    NEW.taxable_amount = NEW.gross_amount - NEW.discount_amount;
    NEW.tax_amount = NEW.taxable_amount * NEW.tax_percentage / 100;
    NEW.net_amount = NEW.taxable_amount + NEW.tax_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate stock transaction quantities
CREATE OR REPLACE FUNCTION calculate_stock_transaction_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate net quantity and stock after
    NEW.net_quantity = NEW.quantity_in - NEW.quantity_out;
    NEW.stock_after = NEW.stock_before + NEW.net_quantity;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON public.pharmacies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON public.medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_items_updated_at BEFORE UPDATE ON public.purchase_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to calculate amounts on purchase items
CREATE TRIGGER calculate_purchase_item_amounts_trigger
    BEFORE INSERT OR UPDATE ON public.purchase_items
    FOR EACH ROW EXECUTE FUNCTION calculate_purchase_item_amounts();

-- Trigger to calculate stock transaction amounts
CREATE TRIGGER calculate_stock_transaction_amounts_trigger
    BEFORE INSERT OR UPDATE ON public.stock_transactions
    FOR EACH ROW EXECUTE FUNCTION calculate_stock_transaction_amounts();

-- Function to update inventory on purchase
CREATE OR REPLACE FUNCTION update_inventory_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update current inventory
    INSERT INTO public.current_inventory (
        pharmacy_id, medicine_id, batch_number, expiry_date,
        current_stock, last_purchase_rate, current_mrp
    )
    SELECT 
        p.pharmacy_id, NEW.medicine_id, NEW.batch_number, NEW.expiry_date,
        NEW.total_quantity, NEW.purchase_rate, NEW.mrp
    FROM public.purchases p 
    WHERE p.id = NEW.purchase_id
    ON CONFLICT (pharmacy_id, medicine_id, batch_number, expiry_date)
    DO UPDATE SET
        current_stock = current_inventory.current_stock + NEW.total_quantity,
        last_purchase_rate = NEW.purchase_rate,
        current_mrp = NEW.mrp,
        last_updated = NOW();

    -- Log stock transaction
    INSERT INTO public.stock_transactions (
        pharmacy_id, medicine_id, batch_number, expiry_date,
        transaction_type, reference_id, reference_type,
        quantity_in, stock_before, rate, amount, user_id
    )
    SELECT 
        p.pharmacy_id, NEW.medicine_id, NEW.batch_number, NEW.expiry_date,
        'purchase', NEW.purchase_id, 'purchase',
        NEW.total_quantity, 
        COALESCE((SELECT current_stock FROM public.current_inventory 
                  WHERE pharmacy_id = p.pharmacy_id 
                  AND medicine_id = NEW.medicine_id 
                  AND batch_number = NEW.batch_number 
                  AND expiry_date = NEW.expiry_date), 0) - NEW.total_quantity,
        NEW.purchase_rate, NEW.net_amount, p.user_id
    FROM public.purchases p 
    WHERE p.id = NEW.purchase_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update inventory on purchase item insert
CREATE TRIGGER trigger_update_inventory_on_purchase
    AFTER INSERT ON public.purchase_items
    FOR EACH ROW EXECUTE FUNCTION update_inventory_on_purchase();

-- Function to generate expiry alerts
CREATE OR REPLACE FUNCTION generate_expiry_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate alerts for 30, 60, 90 days before expiry
    INSERT INTO public.expiry_alerts (
        pharmacy_id, medicine_id, batch_number, expiry_date,
        alert_date, alert_type, days_to_expiry, current_stock, estimated_loss
    )
    SELECT 
        NEW.pharmacy_id, NEW.medicine_id, NEW.batch_number, NEW.expiry_date,
        NEW.expiry_date - INTERVAL '30 days' as alert_date,
        '30_days' as alert_type,
        30 as days_to_expiry,
        NEW.current_stock,
        NEW.current_stock * COALESCE(NEW.last_purchase_rate, 0) as estimated_loss
    WHERE NEW.expiry_date - INTERVAL '30 days' >= CURRENT_DATE
    ON CONFLICT DO NOTHING;

    -- Similar for 60 and 90 days
    INSERT INTO public.expiry_alerts (
        pharmacy_id, medicine_id, batch_number, expiry_date,
        alert_date, alert_type, days_to_expiry, current_stock, estimated_loss
    )
    SELECT 
        NEW.pharmacy_id, NEW.medicine_id, NEW.batch_number, NEW.expiry_date,
        NEW.expiry_date - INTERVAL '60 days' as alert_date,
        '60_days' as alert_type,
        60 as days_to_expiry,
        NEW.current_stock,
        NEW.current_stock * COALESCE(NEW.last_purchase_rate, 0) as estimated_loss
    WHERE NEW.expiry_date - INTERVAL '60 days' >= CURRENT_DATE
    ON CONFLICT DO NOTHING;

    INSERT INTO public.expiry_alerts (
        pharmacy_id, medicine_id, batch_number, expiry_date,
        alert_date, alert_type, days_to_expiry, current_stock, estimated_loss
    )
    SELECT 
        NEW.pharmacy_id, NEW.medicine_id, NEW.batch_number, NEW.expiry_date,
        NEW.expiry_date - INTERVAL '90 days' as alert_date,
        '90_days' as alert_type,
        90 as days_to_expiry,
        NEW.current_stock,
        NEW.current_stock * COALESCE(NEW.last_purchase_rate, 0) as estimated_loss
    WHERE NEW.expiry_date - INTERVAL '90 days' >= CURRENT_DATE
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate expiry alerts
CREATE TRIGGER trigger_generate_expiry_alerts
    AFTER INSERT OR UPDATE ON public.current_inventory
    FOR EACH ROW EXECUTE FUNCTION generate_expiry_alerts();

-- ===============================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expiry_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi-tenant security
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Pharmacy access based on user-pharmacy relationship
CREATE POLICY "Users can view their pharmacies" ON public.pharmacies
    FOR SELECT USING (
        id IN (
            SELECT pharmacy_id FROM public.user_pharmacies 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Similar policies for all pharmacy-related tables
CREATE POLICY "Users can view pharmacy suppliers" ON public.suppliers
    FOR ALL USING (
        pharmacy_id IN (
            SELECT pharmacy_id FROM public.user_pharmacies 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can view pharmacy purchases" ON public.purchases
    FOR ALL USING (
        pharmacy_id IN (
            SELECT pharmacy_id FROM public.user_pharmacies 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can view pharmacy inventory" ON public.current_inventory
    FOR ALL USING (
        pharmacy_id IN (
            SELECT pharmacy_id FROM public.user_pharmacies 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- ===============================================
-- 12. INITIAL DATA
-- ===============================================

-- Insert default medicine categories
INSERT INTO public.medicine_categories (name, description) VALUES
('Analgesics', 'Pain relievers and anti-inflammatory drugs'),
('Antibiotics', 'Antimicrobial medications'),
('Antacids', 'Stomach acid neutralizers'),
('Vitamins', 'Vitamin and mineral supplements'),
('Cough & Cold', 'Respiratory medications'),
('Diabetes', 'Diabetic care medications'),
('Hypertension', 'Blood pressure medications'),
('Cardiac', 'Heart medications'),
('Dermatology', 'Skin care medications'),
('Pediatric', 'Children medications'),
('Gynecology', 'Women health medications'),
('Orthopedic', 'Bone and joint medications'),
('Gastroenterology', 'Digestive system medications'),
('Neurology', 'Nervous system medications'),
('Ophthalmology', 'Eye care medications');

-- ===============================================
-- SCHEMA CREATION COMPLETE
-- ===============================================

-- Final comment
COMMENT ON SCHEMA public IS 'Pharmacy Inventory Management System - Fixed schema with proper calculated fields and triggers.'; 