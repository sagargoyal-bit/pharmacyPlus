-- ===============================================
-- USEFUL VIEWS AND FUNCTIONS FOR PHARMACY SYSTEM
-- ===============================================

-- ===============================================
-- 1. INVENTORY VIEWS
-- ===============================================

-- Current Stock Summary (Medicine-wise)
CREATE VIEW view_current_stock_summary AS
SELECT 
    ci.pharmacy_id,
    m.name AS medicine_name,
    m.generic_name,
    m.manufacturer,
    mc.name AS category,
    SUM(ci.current_stock) AS total_stock,
    SUM(ci.reserved_stock) AS total_reserved,
    SUM(ci.available_stock) AS total_available,
    MIN(ci.expiry_date) AS earliest_expiry,
    COUNT(DISTINCT ci.batch_number) AS batch_count,
    AVG(ci.current_mrp) AS avg_mrp,
    AVG(ci.last_purchase_rate) AS avg_purchase_rate,
    SUM(ci.current_stock * ci.last_purchase_rate) AS stock_value
FROM public.current_inventory ci
JOIN public.medicines m ON ci.medicine_id = m.id
LEFT JOIN public.medicine_categories mc ON m.category_id = mc.id
WHERE ci.is_active = true AND ci.current_stock > 0
GROUP BY ci.pharmacy_id, m.id, m.name, m.generic_name, m.manufacturer, mc.name;

-- Low Stock Alert View
CREATE VIEW view_low_stock_medicines AS
SELECT 
    ci.pharmacy_id,
    m.name AS medicine_name,
    m.generic_name,
    SUM(ci.current_stock) AS total_stock,
    ps.low_stock_threshold,
    CASE 
        WHEN SUM(ci.current_stock) = 0 THEN 'OUT_OF_STOCK'
        WHEN SUM(ci.current_stock) <= ps.low_stock_threshold THEN 'LOW_STOCK'
        ELSE 'NORMAL'
    END AS stock_status
FROM public.current_inventory ci
JOIN public.medicines m ON ci.medicine_id = m.id
JOIN public.pharmacy_settings ps ON ci.pharmacy_id = ps.pharmacy_id
WHERE ci.is_active = true
GROUP BY ci.pharmacy_id, m.id, m.name, m.generic_name, ps.low_stock_threshold
HAVING SUM(ci.current_stock) <= ps.low_stock_threshold;

-- Expiry Alert View
CREATE VIEW view_expiry_alerts AS
SELECT 
    ci.pharmacy_id,
    m.name AS medicine_name,
    ci.batch_number,
    ci.expiry_date,
    ci.current_stock,
    (ci.expiry_date - CURRENT_DATE) AS days_to_expiry,
    ci.current_stock * ci.last_purchase_rate AS estimated_loss,
    CASE 
        WHEN ci.expiry_date <= CURRENT_DATE THEN 'EXPIRED'
        WHEN ci.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'CRITICAL'
        WHEN ci.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'WARNING'
        WHEN ci.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'ALERT'
        ELSE 'NORMAL'
    END AS expiry_status
FROM public.current_inventory ci
JOIN public.medicines m ON ci.medicine_id = m.id
WHERE ci.is_active = true 
AND ci.current_stock > 0 
AND ci.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
ORDER BY ci.expiry_date ASC;

-- ===============================================
-- 2. PURCHASE ANALYSIS VIEWS
-- ===============================================

-- Purchase Summary by Supplier
CREATE VIEW view_purchase_summary_by_supplier AS
SELECT 
    p.pharmacy_id,
    s.name AS supplier_name,
    COUNT(p.id) AS total_purchases,
    SUM(p.total_amount) AS total_amount,
    AVG(p.total_amount) AS avg_purchase_amount,
    MIN(p.purchase_date) AS first_purchase,
    MAX(p.purchase_date) AS last_purchase,
    SUM(CASE WHEN p.payment_status = 'paid' THEN p.total_amount ELSE 0 END) AS paid_amount,
    SUM(CASE WHEN p.payment_status IN ('pending', 'partial') THEN p.balance_amount ELSE 0 END) AS outstanding_amount
FROM public.purchases p
JOIN public.suppliers s ON p.supplier_id = s.id
GROUP BY p.pharmacy_id, s.id, s.name;

-- Monthly Purchase Analysis
CREATE VIEW view_monthly_purchase_analysis AS
SELECT 
    p.pharmacy_id,
    DATE_TRUNC('month', p.purchase_date) AS purchase_month,
    COUNT(p.id) AS total_purchases,
    SUM(p.total_amount) AS total_amount,
    COUNT(DISTINCT p.supplier_id) AS unique_suppliers,
    SUM(pi.total_quantity) AS total_items_purchased,
    COUNT(DISTINCT pi.medicine_id) AS unique_medicines
FROM public.purchases p
JOIN public.purchase_items pi ON p.id = pi.purchase_id
GROUP BY p.pharmacy_id, DATE_TRUNC('month', p.purchase_date)
ORDER BY purchase_month DESC;

-- ===============================================
-- 3. FINANCIAL VIEWS
-- ===============================================

-- Outstanding Payments View
CREATE VIEW view_outstanding_payments AS
SELECT 
    p.pharmacy_id,
    s.name AS supplier_name,
    p.invoice_number,
    p.invoice_date,
    p.due_date,
    p.total_amount,
    p.paid_amount,
    p.balance_amount,
    (CURRENT_DATE - p.due_date) AS days_overdue,
    CASE 
        WHEN p.due_date < CURRENT_DATE THEN 'OVERDUE'
        WHEN p.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'DUE_SOON'
        ELSE 'NORMAL'
    END AS payment_status
FROM public.purchases p
JOIN public.suppliers s ON p.supplier_id = s.id
WHERE p.balance_amount > 0
ORDER BY p.due_date ASC;

-- ===============================================
-- 4. FUNCTIONS FOR COMMON OPERATIONS
-- ===============================================

-- Function to get current stock for a medicine
CREATE OR REPLACE FUNCTION get_medicine_stock(
    p_pharmacy_id UUID,
    p_medicine_id UUID
) RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(current_stock) 
         FROM public.current_inventory 
         WHERE pharmacy_id = p_pharmacy_id 
         AND medicine_id = p_medicine_id 
         AND is_active = true), 
        0
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get medicines expiring in X days
CREATE OR REPLACE FUNCTION get_expiring_medicines(
    p_pharmacy_id UUID,
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    medicine_name TEXT,
    batch_number TEXT,
    expiry_date DATE,
    current_stock INTEGER,
    days_to_expiry INTEGER,
    estimated_loss DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.name::TEXT,
        ci.batch_number::TEXT,
        ci.expiry_date,
        ci.current_stock,
        (ci.expiry_date - CURRENT_DATE)::INTEGER AS days_to_expiry,
        (ci.current_stock * ci.last_purchase_rate)::DECIMAL(12,2) AS estimated_loss
    FROM public.current_inventory ci
    JOIN public.medicines m ON ci.medicine_id = m.id
    WHERE ci.pharmacy_id = p_pharmacy_id
    AND ci.expiry_date <= CURRENT_DATE + (p_days || ' days')::INTERVAL
    AND ci.current_stock > 0
    AND ci.is_active = true
    ORDER BY ci.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate inventory valuation
CREATE OR REPLACE FUNCTION calculate_inventory_value(
    p_pharmacy_id UUID
) RETURNS TABLE (
    total_items INTEGER,
    total_value_at_purchase DECIMAL(12,2),
    total_value_at_mrp DECIMAL(12,2),
    potential_profit DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(ci.current_stock)::INTEGER AS total_items,
        SUM(ci.current_stock * ci.last_purchase_rate)::DECIMAL(12,2) AS total_value_at_purchase,
        SUM(ci.current_stock * ci.current_mrp)::DECIMAL(12,2) AS total_value_at_mrp,
        (SUM(ci.current_stock * ci.current_mrp) - SUM(ci.current_stock * ci.last_purchase_rate))::DECIMAL(12,2) AS potential_profit
    FROM public.current_inventory ci
    WHERE ci.pharmacy_id = p_pharmacy_id
    AND ci.is_active = true
    AND ci.current_stock > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get top selling medicines (when sales module is added)
CREATE OR REPLACE FUNCTION get_purchase_statistics(
    p_pharmacy_id UUID,
    p_from_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_to_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    medicine_name TEXT,
    total_quantity INTEGER,
    total_amount DECIMAL(12,2),
    avg_rate DECIMAL(10,2),
    purchase_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.name::TEXT AS medicine_name,
        SUM(pi.total_quantity)::INTEGER AS total_quantity,
        SUM(pi.net_amount)::DECIMAL(12,2) AS total_amount,
        AVG(pi.purchase_rate)::DECIMAL(10,2) AS avg_rate,
        COUNT(pi.id)::INTEGER AS purchase_count
    FROM public.purchase_items pi
    JOIN public.purchases p ON pi.purchase_id = p.id
    JOIN public.medicines m ON pi.medicine_id = m.id
    WHERE p.pharmacy_id = p_pharmacy_id
    AND p.purchase_date BETWEEN p_from_date AND p_to_date
    GROUP BY m.id, m.name
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 5. DASHBOARD QUERIES
-- ===============================================

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_pharmacy_id UUID)
RETURNS TABLE (
    total_medicines INTEGER,
    todays_purchases DECIMAL(12,2),
    expiring_soon INTEGER,
    low_stock_count INTEGER,
    out_of_stock_count INTEGER,
    total_stock_value DECIMAL(12,2),
    pending_payments DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total unique medicines in stock
        (SELECT COUNT(DISTINCT medicine_id) 
         FROM public.current_inventory 
         WHERE pharmacy_id = p_pharmacy_id AND current_stock > 0)::INTEGER,
         
        -- Today's purchase amount
        COALESCE((SELECT SUM(total_amount) 
                 FROM public.purchases 
                 WHERE pharmacy_id = p_pharmacy_id 
                 AND purchase_date = CURRENT_DATE), 0)::DECIMAL(12,2),
                 
        -- Medicines expiring in 30 days
        (SELECT COUNT(*) 
         FROM public.current_inventory ci
         WHERE ci.pharmacy_id = p_pharmacy_id 
         AND ci.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
         AND ci.current_stock > 0)::INTEGER,
         
        -- Low stock medicines
        (SELECT COUNT(*) FROM view_low_stock_medicines 
         WHERE pharmacy_id = p_pharmacy_id 
         AND stock_status = 'LOW_STOCK')::INTEGER,
         
        -- Out of stock medicines
        (SELECT COUNT(*) FROM view_low_stock_medicines 
         WHERE pharmacy_id = p_pharmacy_id 
         AND stock_status = 'OUT_OF_STOCK')::INTEGER,
         
        -- Total stock value
        COALESCE((SELECT SUM(current_stock * last_purchase_rate) 
                 FROM public.current_inventory 
                 WHERE pharmacy_id = p_pharmacy_id 
                 AND current_stock > 0), 0)::DECIMAL(12,2),
                 
        -- Pending payments
        COALESCE((SELECT SUM(balance_amount) 
                 FROM public.purchases 
                 WHERE pharmacy_id = p_pharmacy_id 
                 AND balance_amount > 0), 0)::DECIMAL(12,2);
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 6. SEARCH FUNCTIONS
-- ===============================================

-- Function to search medicines by name/generic name
CREATE OR REPLACE FUNCTION search_medicines(
    p_search_term TEXT
) RETURNS TABLE (
    id UUID,
    name TEXT,
    generic_name TEXT,
    manufacturer TEXT,
    strength TEXT,
    category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name::TEXT,
        m.generic_name::TEXT,
        m.manufacturer::TEXT,
        m.strength::TEXT,
        mc.name::TEXT AS category
    FROM public.medicines m
    LEFT JOIN public.medicine_categories mc ON m.category_id = mc.id
    WHERE m.is_active = true
    AND (
        m.name ILIKE '%' || p_search_term || '%' OR
        m.generic_name ILIKE '%' || p_search_term || '%' OR
        m.brand_name ILIKE '%' || p_search_term || '%' OR
        m.manufacturer ILIKE '%' || p_search_term || '%'
    )
    ORDER BY 
        CASE 
            WHEN m.name ILIKE p_search_term || '%' THEN 1
            WHEN m.generic_name ILIKE p_search_term || '%' THEN 2
            WHEN m.name ILIKE '%' || p_search_term || '%' THEN 3
            ELSE 4
        END,
        m.name;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- GRANT PERMISSIONS
-- ===============================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 