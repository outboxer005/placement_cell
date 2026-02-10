-- Temporarily disable RLS on admins table to allow backend operations
-- This is needed because SUPABASE_SERVICE_KEY is currently set to anon key

-- ==========================================
-- DISABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ==========================================
-- This script disables RLS to allow service operations
-- Run this in Supabase Dashboard → SQL Editor
-- ==========================================

-- Disable RLS on all main tables
ALTER TABLE IF EXISTS public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drives DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings DISABLE ROW LEVEL SECURITY;

-- Disable RLS on student-related tables (fixes registration errors)
ALTER TABLE IF EXISTS public.addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_auth DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.education DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: All tables should show rls_enabled = false
rvice_role key from Supabase Dashboard,
-- you can re-enable RLS for better security:
-- 
-- ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- etc.
