-- Add current_year field to students table
-- This tracks the student's current academic year (1st Year, 2nd Year, 3rd Year, 4th Year)

-- Add current_year column
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS current_year TEXT;

COMMENT ON COLUMN public.students.current_year IS 'Current academic year of study (e.g., 1st Year, 2nd Year, 3rd Year, 4th Year)';

-- Create index for current_year for faster filtering
CREATE INDEX IF NOT EXISTS idx_students_current_year 
ON public.students(current_year) 
WHERE current_year IS NOT NULL;

-- Verification query
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('year', 'section', 'current_year')
ORDER BY column_name;
