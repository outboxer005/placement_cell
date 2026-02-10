# SQL Migration Guide

## Overview
This directory contains SQL migration scripts for the Supabase PostgreSQL database.

## Applying RLS Migration

### Prerequisites
- Access to Supabase Dashboard
- Project URL: https://abusfzhvkokluodzvbor.supabase.co

### Steps to Apply

1. **Open Supabase SQL Editor**
   - Navigate to https://supabase.com/dashboard
   - Select your project
   - Go to SQL Editor tab

2. **Copy Migration Script**
   - Open `enable_rls.sql` in this directory
   - Copy the entire contents

3. **Execute in SQL Editor**
   - Paste the script into the SQL Editor
   - Click "Run" button
   - Wait for confirmation (should see "Success" message)

4. **Verify Policies Created**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```
   - You should see policies for all 10 tables
   - Each table should have multiple policies (service_role, admin, student)

### What This Migration Does

- **Enables Row Level Security (RLS)** on all 10 tables:
  - admins
  - students
  - student_auth
  - addresses
  - education_records
  - companies
  - drives
  - applications
  - notifications
  - settings

- **Creates Role-Based Policies**:
  - **service_role**: Full access (used by backend API) - bypasses RLS
  - **main-admin**: Full access to all data
  - **branch-admin**: Access restricted to their branch
  - **student**: Access only to their own data

### Important Notes

⚠️ **Backend API Not Affected**: The backend uses `SUPABASE_SERVICE_KEY` (service_role) which bypasses RLS. All existing functionality will continue to work.

✅ **Enhanced Security**: RLS protects against direct database access (e.g., from Supabase Dashboard, client-side queries, or compromised anon keys)

🔒 **Data Isolation**: Students cannot access other students' data, branch admins cannot access other branches' data

### Rollback Instructions

If you need to rollback this migration:

```sql
-- Disable RLS on all tables
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_auth DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drives DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Drop all policies (optional - policies won't apply if RLS is disabled)
DROP POLICY IF EXISTS "Service role has full access to admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can read all admins" ON public.admins;
DROP POLICY IF EXISTS "Main admins can manage all admins" ON public.admins;
-- ... (repeat for all policies)
```

### Troubleshooting

**Error: "permission denied for table"**
- This means a policy is too restrictive
- Check that you're using the service_role key in backend

**Policies not working as expected**
- Verify JWT payload contains correct role and branch fields
- Check that auth.jwt() function is available
- Test with different user roles

**Backend API returns 403 errors**
- Verify `SUPABASE_SERVICE_KEY` is set correctly in .env
- Service role key bypasses RLS - if using anon key, requests will be restricted

## Testing RLS

After applying the migration:

1. **Test with service key** (backend):
   ```bash
   cd c:\Freelancing\place_vig\server
   node test-db-connection.js
   ```
   Expected: All tables accessible

2. **Test with anon key** (should be restricted):
   - Try accessing data directly from Supabase Dashboard with anon key
   - Should see limited/no data based on policies

3. **Test student app**:
   - Login as student
   - Verify can only see own data
   - Try accessing another student's data (should fail)
