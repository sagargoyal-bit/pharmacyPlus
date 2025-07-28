# 🔍 Supabase Connection Debugging

## The Issue
You have **4 users in Supabase Auth** but the API returns an **empty array**. This usually means:

1. **Users exist in `auth.users`** (Supabase authentication system)
2. **Users DON'T exist in `public.users`** (your application's user table)

---

## 🧪 Quick Test

### 1. Test Your Connection
Visit: **http://localhost:3000/api/test-connection**

This will show you:
- ✅ Environment variables status
- ✅ Database connection
- ✅ Auth users count
- ✅ Public users count  
- ✅ Table existence

### 2. Check Console Logs
Look at your terminal/console for detailed debug information.

---

## 🔧 Common Issues & Solutions

### **Issue 1: Environment Variables Missing**
**Symptoms:** `Missing Supabase environment variables`

**Solution:** Update your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **Issue 2: Tables Don't Exist**
**Symptoms:** `relation "users" does not exist`

**Solution:** Run the database schema:
```sql
-- In Supabase SQL Editor, run:
-- File: database/supabase_schema_fixed.sql
```

### **Issue 3: Users in Auth but Not in Public Table**
**Symptoms:** `auth.users` has users, `public.users` is empty

**Solution A - Copy User IDs:**
1. Go to **Authentication → Users** in Supabase Dashboard
2. Copy the UUIDs of your users
3. Run this SQL in Supabase SQL Editor:

```sql
-- Replace these UUIDs with your actual user IDs
INSERT INTO public.users (id, email, full_name, phone, role) VALUES
('your-actual-user-id-1', 'admin@medplus.com', 'Admin User', '+91-9876543210', 'admin'),
('your-actual-user-id-2', 'pharmacist@medplus.com', 'Pharmacist User', '+91-9876543211', 'pharmacist'),
('your-actual-user-id-3', 'staff@medplus.com', 'Staff User', '+91-9876543212', 'staff');
```

**Solution B - Auto-sync (Advanced):**
```sql
-- This copies all auth users to public.users
INSERT INTO public.users (id, email, full_name, role, is_active)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    'pharmacist',  -- default role
    true
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users);
```

### **Issue 4: Row Level Security (RLS) Blocking**
**Symptoms:** Connection works but queries return empty

**Solution:** Temporarily disable RLS for testing:
```sql
-- In Supabase SQL Editor:
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

---

## 🎯 Quick Fix Steps

### **Step 1:** Test Connection
```bash
# Visit this URL:
http://localhost:3000/api/test-connection
```

### **Step 2:** Get Your User IDs
1. Go to **Supabase Dashboard → Authentication → Users**
2. Copy the **ID** of each user (long UUID string)

### **Step 3:** Insert Users into Public Table
```sql
-- Replace the UUIDs with your actual user IDs:
INSERT INTO public.users (id, email, full_name, role) VALUES
('PASTE_ACTUAL_UUID_HERE', 'user1@email.com', 'User 1', 'admin'),
('PASTE_ACTUAL_UUID_HERE', 'user2@email.com', 'User 2', 'pharmacist');
```

### **Step 4:** Create a Pharmacy
```sql
INSERT INTO public.pharmacies (id, name, license_number, address, city, state, pincode, phone, owner_id) VALUES
('pharmacy-uuid-001', 'Test Pharmacy', 'LIC001', '123 Main St', 'Mumbai', 'Maharashtra', '400001', '+91-1234567890', 'PASTE_ADMIN_USER_UUID_HERE');
```

### **Step 5:** Test Again
Visit: **http://localhost:3000/api/test-connection**

---

## 📱 Test Your Purchase Form

Once users are created, test the purchase form:

1. Go to **http://localhost:3000/admin/purchases**
2. Click **"+ Add Purchase"**
3. Fill the form and submit
4. Check console logs for the API response

---

## 🆘 Still Having Issues?

1. **Check server console** for detailed error messages
2. **Verify your Supabase project** is active
3. **Test with a simple query** in Supabase SQL Editor:
   ```sql
   SELECT * FROM auth.users LIMIT 5;
   SELECT * FROM public.users LIMIT 5;
   ```

Let me know what the test connection shows! 🔍 