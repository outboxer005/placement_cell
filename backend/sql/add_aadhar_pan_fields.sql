-- ==========================================
-- Add Aadhar and PAN Card Fields to Students
-- ==========================================
-- Run this in Supabase Dashboard → SQL Editor
-- ==========================================

-- Add aadhar_number column (12 digits)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS aadhar_number TEXT;

-- Add pan_card column (10 alphanumeric: ABCDE1234F format)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS pan_card TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.students.aadhar_number IS 'Student Aadhar card number (12 digits)';
COMMENT ON COLUMN public.students.pan_card IS 'Student PAN card number (10 alphanumeric characters)';

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_students_aadhar ON public.students(aadhar_number) WHERE aadhar_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_pan ON public.students(pan_card) WHERE pan_card IS NOT NULL;

-- Verify the columns were added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'students'
  AND column_name IN ('aadhar_number', 'pan_card');
