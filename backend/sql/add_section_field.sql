-- Add section field to students table
-- This allows tracking student section (A, B, C, etc.) within their year/branch

-- Add section column
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS section TEXT;

COMMENT ON COLUMN public.students.section IS 'Student section/division (e.g., A, B, C)';

-- Create index for section for faster filtering
CREATE INDEX IF NOT EXISTS idx_students_section 
ON public.students(section) 
WHERE section IS NOT NULL;

-- Verification query
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('year', 'section')
ORDER BY column_name;
