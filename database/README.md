# Pharmacy Inventory Management - Database Setup

## Overview

This directory contains the complete database schema and setup files for the Pharmacy Inventory Management System built on Supabase PostgreSQL.

## Files Structure

```
database/
├── supabase_schema.sql      # Complete database schema
├── sample_data.sql          # Sample data for testing
├── useful_views.sql         # Views and functions for common queries
└── README.md               # This file
```

## Database Schema Overview

### Core Tables

#### 1. **Authentication & Users**
- `public.users` - Extended user profiles linked to Supabase auth
- `public.pharmacies` - Pharmacy/shop information  
- `public.user_pharmacies` - Multi-pharmacy access management

#### 2. **Master Data**
- `public.medicine_categories` - Medicine categories (Analgesics, Antibiotics, etc.)
- `public.medicines` - Medicine master data with composition, strength, etc.
- `public.suppliers` - Supplier information with contact details

#### 3. **Purchase Management**
- `public.purchases` - Purchase orders/invoices
- `public.purchase_items` - Individual medicine items in each purchase

#### 4. **Inventory Management**
- `public.current_inventory` - Real-time stock levels by batch
- `public.stock_transactions` - Complete audit trail of stock movements
- `public.expiry_alerts` - Automated expiry tracking and alerts

#### 5. **Configuration**
- `public.pharmacy_settings` - Pharmacy-specific settings
- `public.expiry_alerts` - Expiry alert configurations

## Setup Instructions

### 1. Create Database Schema

```sql
-- Run in Supabase SQL Editor
-- Copy and paste the entire contents of supabase_schema.sql
```

### 2. Insert Sample Data (Optional)

```sql
-- Run sample_data.sql for testing
-- Note: Update UUID values to match your actual user IDs from Supabase Auth
```

### 3. Create Views and Functions

```sql
-- Run useful_views.sql to create helpful views and functions
```

## Key Features

### 🔒 **Row Level Security (RLS)**
- Multi-tenant architecture with pharmacy-based data isolation
- Users can only access data from pharmacies they're associated with
- Secure authentication through Supabase Auth

### 📊 **Automated Inventory Tracking**
- Automatic stock updates when purchases are recorded
- Real-time inventory calculations with batch tracking
- Comprehensive stock transaction logging

### ⚠️ **Expiry Management**
- Automated expiry alerts (30, 60, 90 days before expiry)
- Estimated financial loss calculations
- Configurable alert thresholds

### 💰 **Financial Calculations**
- Automatic price calculations with discounts and taxes
- Purchase amount tracking with payment status
- Outstanding payment monitoring

### 🔍 **Advanced Search & Reporting**
- Medicine search by name, generic name, manufacturer
- Stock level monitoring with low stock alerts
- Purchase analytics and supplier performance tracking

## Important Configuration

### Environment Variables
Create these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Supabase Settings

1. **Enable Row Level Security** on all tables
2. **Configure Authentication** policies
3. **Set up Email Templates** for user invitations
4. **Configure Storage** for any file uploads (future)

## Common Queries

### Get Current Stock for a Medicine
```sql
SELECT get_medicine_stock('pharmacy_id', 'medicine_id');
```

### Get Medicines Expiring Soon
```sql
SELECT * FROM get_expiring_medicines('pharmacy_id', 30);
```

### Get Dashboard Statistics
```sql
SELECT * FROM get_dashboard_stats('pharmacy_id');
```

### Search Medicines
```sql
SELECT * FROM search_medicines('paracetamol');
```

## Views Available

- `view_current_stock_summary` - Medicine-wise stock summary
- `view_low_stock_medicines` - Low stock alerts
- `view_expiry_alerts` - Expiry status of all medicines
- `view_purchase_summary_by_supplier` - Purchase analytics by supplier
- `view_monthly_purchase_analysis` - Monthly purchase trends
- `view_outstanding_payments` - Pending payments tracking

## Data Flow

```
1. User creates purchase entry
   ↓
2. Purchase record created in 'purchases' table
   ↓
3. Medicine items added to 'purchase_items' table
   ↓
4. Triggers automatically:
   - Update 'current_inventory' 
   - Log to 'stock_transactions'
   - Generate 'expiry_alerts'
   ↓
5. Real-time inventory and alerts updated
```

## Performance Optimizations

### Indexes Created
- Medicine name, generic name, manufacturer
- Purchase dates, status, invoice numbers
- Inventory expiry dates, stock levels
- Batch numbers and transaction types

### Computed Columns
- `total_quantity` = quantity + free_quantity
- `gross_amount` = quantity × purchase_rate
- `net_amount` = taxable_amount + tax_amount
- `available_stock` = current_stock - reserved_stock

## Security Features

### Row Level Security Policies
```sql
-- Users can only access their pharmacy data
CREATE POLICY "pharmacy_access" ON table_name
FOR ALL USING (
  pharmacy_id IN (
    SELECT pharmacy_id FROM user_pharmacies 
    WHERE user_id = auth.uid() AND is_active = true
  )
);
```

### Data Validation
- CHECK constraints on quantities, amounts
- UNIQUE constraints on critical business data
- Foreign key relationships with appropriate CASCADE/RESTRICT rules

## Backup & Maintenance

### Recommended Backup Strategy
1. **Daily automated backups** through Supabase
2. **Weekly exports** of critical data
3. **Monthly archive** of old transactions

### Maintenance Tasks
- Monitor slow queries and optimize indexes
- Clean up old stock transactions (>2 years)
- Archive expired medicine batches
- Review and update expiry alert thresholds

## Migration Support

### Future Schema Changes
- Use Supabase migrations for schema updates
- Maintain backward compatibility for API changes
- Test migrations on staging environment first

### Data Import/Export
- CSV import/export functions for medicines master data
- Bulk supplier data import capabilities
- Inventory reconciliation tools

## Troubleshooting

### Common Issues

1. **RLS Blocking Queries**
   - Verify user has proper pharmacy access
   - Check `user_pharmacies` table for active relationships

2. **Trigger Failures**
   - Check purchase_items data completeness
   - Verify medicine_id exists in medicines table

3. **Performance Issues**
   - Monitor query execution plans
   - Consider adding indexes for custom queries
   - Use views for complex reporting queries

### Support Queries

```sql
-- Check user pharmacy access
SELECT * FROM user_pharmacies WHERE user_id = auth.uid();

-- Verify inventory triggers working
SELECT * FROM stock_transactions ORDER BY created_at DESC LIMIT 10;

-- Check for orphaned records
SELECT COUNT(*) FROM purchase_items pi 
LEFT JOIN medicines m ON pi.medicine_id = m.id 
WHERE m.id IS NULL;
```

## Contact & Support

For database-related issues:
1. Check the troubleshooting section above
2. Review Supabase logs for error details
3. Test queries in Supabase SQL Editor
4. Verify RLS policies are correctly configured

This database schema is designed to be production-ready with proper security, performance optimizations, and comprehensive audit trails for a pharmacy inventory management system. 