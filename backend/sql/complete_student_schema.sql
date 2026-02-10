-- ==========================================
-- Complete Student Table Schema Update
-- ==========================================
-- This script ensures all required columns exist in the students table
-- Run this in Supabase Dashboard → SQL Editor
-- ==========================================

-- Add first_name column if not exists
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Add last_name column if not exists
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add legacy name column for backward compatibility (optional)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add break_in_studies column if not exists
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS break_in_studies BOOLEAN DEFAULT false;

-- Add has_backlogs column if not exists
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS has_backlogs BOOLEAN DEFAULT false;

-- Add other common student columns if missing
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS branch TEXT;

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS batch TEXT;

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Add timestamps
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comments for documentation
COMMENT ON COLUMN public.students.first_name IS 'Student first name';
COMMENT ON COLUMN public.students.last_name IS 'Student last name (surname)';
COMMENT ON COLUMN public.students.name IS 'Legacy full name field (optional)';
COMMENT ON COLUMN public.students.break_in_studies IS 'Indicates if student has taken a break in their studies';
COMMENT ON COLUMN public.students.has_backlogs IS 'Indicates if student has pending backlogs';
COMMENT ON COLUMN public.students.email IS 'Student email address (unique)';
COMMENT ON COLUMN public.students.phone IS 'Student contact number';
COMMENT ON COLUMN public.students.branch IS 'Student department/branch';
COMMENT ON COLUMN public.students.batch IS 'Student graduation batch/year';
COMMENT ON COLUMN public.students.profile_completed IS 'Whether student has completed their profile';

-- Create or replace function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if not exists
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the columns were added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'students'
ORDER BY ordinal_position;

-- Show row count
SELECT COUNT(*) as total_students FROM public.students;
