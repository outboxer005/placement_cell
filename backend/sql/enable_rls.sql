-- ==========================================
-- Row Level Security (RLS) Migration
-- ==========================================
-- This script enables RLS on all tables and creates policies for role-based access control
-- 
-- Roles:
--   - service_role: Full access (bypass RLS) - used by backend API
--   - authenticated: JWT-authenticated users (admins and students)
--   - anon: Anonymous users (for registration/login)
--
-- Apply this script in Supabase Dashboard → SQL Editor
-- ==========================================

-- ==========================================
-- 1. ADMINS TABLE
-- ==========================================

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (backend API)
CREATE POLICY "Service role has full access to admins"
  ON public.admins
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated admins can read all admins
CREATE POLICY "Admins can read all admins"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('main-admin', 'branch-admin')
  );

-- Policy: Main admins can manage all admins
CREATE POLICY "Main admins can manage all admins"
  ON public.admins
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'main-admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'main-admin'
  );

-- ==========================================
-- 2. STUDENTS TABLE
-- ==========================================

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role has full access to students"
  ON public.students
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Students can read their own data
CREATE POLICY "Students can read own data"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'student' AND
    id::text = auth.jwt() ->> 'sub'
  );

-- Students can update their own data
CREATE POLICY "Students can update own data"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'student' AND
    id::text = auth.jwt() ->> 'sub'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'student' AND
    id::text = auth.jwt() ->> 'sub'
  );

-- Admins can read all students (branch-admin restricted by branch)
CREATE POLICY "Admins can read students"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'main-admin' OR
    (auth.jwt() ->> 'role' = 'branch-admin' AND branch = auth.jwt() ->> 'branch')
  );

-- Admins can manage students (branch-admin restricted by branch)
CREATE POLICY "Admins can manage students"
  ON public.students
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'main-admin' OR
    (auth.jwt() ->> 'role' = 'branch-admin' AND branch = auth.jwt() ->> 'branch')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'main-admin' OR
    (auth.jwt() ->> 'role' = 'branch-admin' AND branch = auth.jwt() ->> 'branch')
  );

-- ==========================================
-- 3. STUDENT_AUTH TABLE
-- ==========================================

ALTER TABLE public.student_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to student_auth"
  ON public.student_auth
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Students can't directly access auth table (only via service role/backend)
-- Admins can view for password reset purposes
CREATE POLICY "Admins can read student_auth"
  ON public.student_auth
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('main-admin', 'branch-admin')
  );

-- ==========================================
-- 4. ADDRESSES TABLE
-- ==========================================

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to addresses"
  ON public.addresses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Students can read/update their own addresses
CREATE POLICY "Students can manage own addresses"
  ON public.addresses
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'student' AND
    student_id::text = auth.jwt() ->> 'sub'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'student' AND
    student_id::text = auth.jwt() ->> 'sub'
  );

-- Admins can read all addresses (with branch restriction for branch-admin)
CREATE POLICY "Admins can read addresses"
  ON public.addresses
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'main-admin' OR
    (auth.jwt() ->> 'role' = 'branch-admin' AND 
     EXISTS (
       SELECT 1 FROM public.students 
       WHERE id = student_id AND branch = auth.jwt() ->> 'branch'
     ))
  );

-- ==========================================
-- 5. EDUCATION_RECORDS TABLE
-- ==========================================

ALTER TABLE public.education_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to education_records"
  ON public.education_records
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Students can manage their own education records
CREATE POLICY "Students can manage own education"
  ON public.education_records
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'student' AND
    student_id::text = auth.jwt() ->> 'sub'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'student' AND
    student_id::text = auth.jwt() ->> 'sub'
  );

-- Admins can read education records
CREATE POLICY "Admins can read education_records"
  ON public.education_records
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'main-admin' OR
    (auth.jwt() ->> 'role' = 'branch-admin' AND 
     EXISTS (
       SELECT 1 FROM public.students 
       WHERE id = student_id AND branch = auth.jwt() ->> 'branch'
     ))
  );

-- ==========================================
-- 6. COMPANIES TABLE
-- ==========================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to companies"
  ON public.companies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Everyone can read companies
CREATE POLICY "Anyone can read companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage companies
CREATE POLICY "Admins can manage companies"
  ON public.companies
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('main-admin', 'branch-admin')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('main-admin', 'branch-admin')
  );

-- ==========================================
-- 7. DRIVES TABLE
-- ==========================================

ALTER TABLE public.drives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to drives"
  ON public.drives
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Students can read published drives
CREATE POLICY "Students can read published drives"
  ON public.drives
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'student' AND status = 'published'
  );

-- Admins can read all drives
CREATE POLICY "Admins can read all drives"
  ON public.drives
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('main-admin', 'branch-admin')
  );

-- Admins can manage drives (branch-admin restricted)
CREATE POLICY "Admins can manage drives"
  ON public.drives
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'main-admin' OR
    (auth.jwt() ->> 'role' = 'branch-admin' AND branch = auth.jwt() ->> 'branch')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'main-admin' OR
    (auth.jwt() ->> 'role' = 'branch-admin' AND branch = auth.jwt() ->> 'branch')
  );

-- ==========================================
-- 8. APPLICATIONS TABLE
-- ==========================================

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to applications"
  ON public.applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Students can read their own applications
CREATE POLICY "Students can read own applications"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'student' AND
    student_id::text = auth.jwt() ->> 'sub'
  );

-- Students can create their own applications
CREATE POLICY "Students can create own applications"
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'student' AND
    student_id::text = auth.jwt() ->> 'sub'
  );

-- Students can delete their own pending applications
CREATE POLICY "Students can delete own pending applications"
  ON public.applications
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'student' AND
    student_id::text = auth.jwt() ->> 'sub' AND
    status = 'pending'
  );

-- Admins can read all applications
CREATE POLICY "Admins can read applications"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('main-admin', 'branch-admin')
  );

-- Admins can update applications (status changes)
CREATE POLICY "Admins can update applications"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('main-admin', 'branch-admin')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('main-admin', 'branch-admin')
  );

-- ==========================================
-- 9. NOTIFICATIONS TABLE
-- ==========================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to notifications"
  ON public.notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Students can read their own notifications
CREATE POLICY "Students can read own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'student' AND
    student_id::text = auth.jwt() ->> 'sub'
  );

-- Students can update their own notifications (mark as read)
CREATE POLICY "Students can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'student' AND
    student_id::text = auth.jwt() ->> 'sub'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'student' AND
    student_id::text = auth.jwt() ->> 'sub'
  );

-- Admins can read all notifications
CREATE POLICY "Admins can read notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('main-admin', 'branch-admin')
  );

-- Admins can create notifications
CREATE POLICY "Admins can create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('main-admin', 'branch-admin')
  );

-- ==========================================
-- 10. SETTINGS TABLE
-- ==========================================

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to settings"
  ON public.settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Everyone can read settings
CREATE POLICY "Anyone can read settings"
  ON public.settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only main admins can manage settings
CREATE POLICY "Main admins can manage settings"
  ON public.settings
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'main-admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'main-admin'
  );

-- ==========================================
-- END OF MIGRATION
-- ==========================================
-- 
-- To verify policies were created, run:
-- 
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
--
-- ==========================================
