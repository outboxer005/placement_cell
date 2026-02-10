-- ==========================================
-- ENHANCE DRIVES TABLE SCHEMA
-- ==========================================
-- Adds enhanced fields for drive management:
-- - Direct company name
-- - CTC/salary range
-- - Description and registration links
-- - Bond details
-- - Benefits (JSON)
-- ==========================================

-- Add enhanced drive fields
ALTER TABLE public.drives
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS ctc_min NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS ctc_max NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS description_link TEXT,
ADD COLUMN IF NOT EXISTS registration_link TEXT,
ADD COLUMN IF NOT EXISTS bond_details TEXT,
ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_drives_company_name ON public.drives(company_name);
CREATE INDEX IF NOT EXISTS idx_drives_ctc_min ON public.drives(ctc_min);

-- Add comments for documentation
COMMENT ON COLUMN public.drives.company_name IS 'Direct company name (alternative to company_id reference)';
COMMENT ON COLUMN public.drives.ctc_min IS 'Minimum CTC/salary in LPA (Lakhs Per Annum)';
COMMENT ON COLUMN public.drives.ctc_max IS 'Maximum CTC/salary in LPA (Lakhs Per Annum)';
COMMENT ON COLUMN public.drives.description_link IS 'External URL for detailed job description/JD';
COMMENT ON COLUMN public.drives.registration_link IS 'Direct application/registration URL for students';
COMMENT ON COLUMN public.drives.bond_details IS 'Service bond or agreement details (years, amount, conditions)';
COMMENT ON COLUMN public.drives.benefits IS 'JSON object containing perks: {medical: bool, wfh: bool, relocation: bool, etc}';

-- Update existing drives to have empty benefits object
UPDATE public.drives
SET benefits = '{}'::jsonb
WHERE benefits IS NULL;

-- Ensure eligibility JSONB has branches array
UPDATE public.drives
SET eligibility = COALESCE(eligibility, '{}'::jsonb) || '{"branches": []}'::jsonb
WHERE eligibility IS NULL OR NOT (eligibility ? 'branches');

-- Verify new columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'drives'
  AND column_name IN ('company_name', 'ctc_min', 'ctc_max', 'description_link', 'registration_link', 'bond_details', 'benefits')
ORDER BY ordinal_position;
