-- ==========================================
-- Add Missing Student Columns Migration
-- ==========================================
-- This migration adds the firstName, lastName, break_in_studies, and has_backlogs columns
-- that are used in the application but missing from the database schema.
--
-- Apply this script in Supabase Dashboard → SQL Editor
-- ==========================================

-- Add firstName column (nullable text)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT NULL;

-- Add lastName column (nullable text)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT NULL;

-- Add break_in_studies column (nullable boolean)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS break_in_studies BOOLEAN DEFAULT NULL;

-- Add has_backlogs column (nullable boolean)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS has_backlogs BOOLEAN DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.students.first_name IS 'Student first name';
COMMENT ON COLUMN public.students.last_name IS 'Student last name (surname)';
COMMENT ON COLUMN public.students.break_in_studies IS 'Indicates if student has taken a break in their studies';
COMMENT ON COLUMN public.students.has_backlogs IS 'Indicates if student has pending backlogs';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'students' 
  AND column_name IN ('first_name', 'last_name', 'break_in_studies', 'has_backlogs');
