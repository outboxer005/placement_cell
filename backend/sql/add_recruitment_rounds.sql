-- ==========================================
-- Add Multi-Round Recruitment Tracking
-- ==========================================
-- This script adds support for tracking students through
-- multiple recruitment rounds (e.g., Aptitude, Technical, HR)
-- Run this in Supabase Dashboard → SQL Editor
-- ==========================================

-- Step 1: Add rounds configuration to drives table
ALTER TABLE public.drives
ADD COLUMN IF NOT EXISTS total_rounds INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS round_names JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.drives.total_rounds IS 'Number of recruitment rounds for this drive (1-10)';
COMMENT ON COLUMN public.drives.round_names IS 'Optional array of custom round names, e.g. ["Aptitude", "Technical", "HR"]';

-- Step 2: Add round tracking to applications table
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS round_status JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.applications.current_round IS 'Current round number the student is in (1-indexed)';
COMMENT ON COLUMN public.applications.round_status IS 'Array of round results with status, timestamps, and admin who updated';

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_current_round ON public.applications(current_round);
CREATE INDEX IF NOT EXISTS idx_applications_round_status ON public.applications USING GIN(round_status);

-- Step 4: Update existing drives to have default round values
UPDATE public.drives
SET total_rounds = 1
WHERE total_rounds IS NULL;

UPDATE public.drives
SET round_names = '[]'::jsonb
WHERE round_names IS NULL;

-- Step 5: Update existing applications to have default round values
UPDATE public.applications
SET current_round = 1
WHERE current_round IS NULL;

UPDATE public.applications
SET round_status = '[]'::jsonb
WHERE round_status IS NULL;

-- Verification query
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('drives', 'applications')
  AND column_name IN ('total_rounds', 'round_names', 'current_round', 'round_status')
ORDER BY table_name, ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Multi-round recruitment tracking schema updated successfully!';
  RAISE NOTICE 'Drives now support multiple rounds with custom names.';
  RAISE NOTICE 'Applications now track progress through each round.';
END $$;
