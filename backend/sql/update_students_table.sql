-- ==========================================
-- UPDATE STUDENTS TABLE - Add Missing Columns
-- ==========================================
-- Copy and paste this entire script into Supabase SQL Editor
-- ==========================================

-- Add first_name and last_name columns
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add full_name as a GENERATED column (auto-computed from first_name + last_name)
-- Drop it first if it exists to recreate it properly
ALTER TABLE public.students DROP COLUMN IF EXISTS full_name;
ALTER TABLE public.students ADD COLUMN full_name TEXT GENERATED ALWAYS AS (
  CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
    THEN first_name || ' ' || last_name
    WHEN first_name IS NOT NULL 
    THEN first_name
    ELSE NULL
  END
) STORED;

-- Add other required columns
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS break_in_studies BOOLEAN DEFAULT false;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS has_backlogs BOOLEAN DEFAULT false;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS batch TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comment for full_name
COMMENT ON COLUMN public.students.full_name IS 'Auto-computed full name from first_name and last_name';