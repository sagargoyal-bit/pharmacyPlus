-- ===============================================
-- QUICK FIX FOR GENERATED COLUMN ISSUES
-- Run this if you already executed the problematic schema
-- ===============================================

-- Fix 1: Drop and recreate purchase_items table with trigger-based calculations
DROP TABLE IF EXISTS public.purchase_items CASCADE;

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
    total_quantity INTEGER DEFAULT 0, -- Will be calculated by trigger
    
    -- Pricing (base fields)
    mrp DECIMAL(10,2) NOT NULL,
    purchase_rate DECIMAL(10,2) NOT NULL,
    selling_rate DECIMAL(10,2),
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Financial calculations (calculated by triggers)
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

-- Fix 2: Drop and recreate stock_transactions table
DROP TABLE IF EXISTS public.stock_transactions CASCADE;

CREATE TABLE public.stock_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE RESTRICT,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    
    -- Transaction Details
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'return', 'adjustment', 'expired', 'damaged')),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_id UUID,
    reference_type TEXT,
    
    -- Quantity Changes (calculated by triggers)
    quantity_in INTEGER DEFAULT 0,
    quantity_out INTEGER DEFAULT 0,
    net_quantity INTEGER DEFAULT 0,
    
    -- Stock Levels (calculated by triggers)
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

-- Fix 3: Create trigger functions for calculations
CREATE OR REPLACE FUNCTION calculate_purchase_item_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate quantities
    NEW.total_quantity = NEW.quantity + NEW.free_quantity;
    
    -- Calculate all amounts based on base fields
    NEW.gross_amount = NEW.quantity * NEW.purchase_rate;
    NEW.discount_amount = NEW.gross_amount * NEW.discount_percentage / 100;
    NEW.taxable_amount = NEW.gross_amount - NEW.discount_amount;
    NEW.tax_amount = NEW.taxable_amount * NEW.tax_percentage / 100;
    NEW.net_amount = NEW.taxable_amount + NEW.tax_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_stock_transaction_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate net quantity and stock after
    NEW.net_quantity = NEW.quantity_in - NEW.quantity_out;
    NEW.stock_after = NEW.stock_before + NEW.net_quantity;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix 4: Create triggers
CREATE TRIGGER calculate_purchase_item_amounts_trigger
    BEFORE INSERT OR UPDATE ON public.purchase_items
    FOR EACH ROW EXECUTE FUNCTION calculate_purchase_item_amounts();

CREATE TRIGGER calculate_stock_transaction_amounts_trigger
    BEFORE INSERT OR UPDATE ON public.stock_transactions
    FOR EACH ROW EXECUTE FUNCTION calculate_stock_transaction_amounts();

-- Fix 5: Recreate indexes for purchase_items
CREATE INDEX idx_purchase_items_purchase ON public.purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_medicine ON public.purchase_items(medicine_id);
CREATE INDEX idx_purchase_items_expiry ON public.purchase_items(expiry_date);
CREATE INDEX idx_purchase_items_batch ON public.purchase_items(batch_number);

-- Fix 6: Recreate indexes for stock_transactions  
CREATE INDEX idx_stock_transactions_pharmacy ON public.stock_transactions(pharmacy_id);
CREATE INDEX idx_stock_transactions_medicine ON public.stock_transactions(medicine_id);
CREATE INDEX idx_stock_transactions_date ON public.stock_transactions(transaction_date);
CREATE INDEX idx_stock_transactions_type ON public.stock_transactions(transaction_type);

-- Fix 7: Recreate the inventory update trigger
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

CREATE TRIGGER trigger_update_inventory_on_purchase
    AFTER INSERT ON public.purchase_items
    FOR EACH ROW EXECUTE FUNCTION update_inventory_on_purchase();

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Test the triggers work correctly
-- You can run these after fixing to verify everything works:

/*
-- Test purchase item calculations
INSERT INTO public.purchase_items (
    purchase_id, medicine_id, batch_number, expiry_date,
    quantity, free_quantity, purchase_rate, discount_percentage, tax_percentage, mrp
) VALUES (
    gen_random_uuid(), gen_random_uuid(), 'TEST001', '2025-12-31',
    100, 10, 8.50, 10.0, 12.0, 10.50
);

-- Check if calculations worked
SELECT quantity, free_quantity, total_quantity, gross_amount, discount_amount, 
       taxable_amount, tax_amount, net_amount 
FROM public.purchase_items 
WHERE batch_number = 'TEST001';

-- Test stock transaction calculations  
INSERT INTO public.stock_transactions (
    pharmacy_id, medicine_id, batch_number, expiry_date,
    transaction_type, quantity_in, quantity_out, stock_before, user_id
) VALUES (
    gen_random_uuid(), gen_random_uuid(), 'TEST002', '2025-12-31',
    'purchase', 100, 0, 50, gen_random_uuid()
);

-- Check if calculations worked
SELECT quantity_in, quantity_out, net_quantity, stock_before, stock_after
FROM public.stock_transactions 
WHERE batch_number = 'TEST002';
*/

COMMENT ON SCHEMA public IS 'Fixed schema - generated column issues resolved with triggers.'; 