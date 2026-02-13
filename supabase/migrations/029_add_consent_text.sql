-- Add consent_text column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS consent_text TEXT;

COMMENT ON COLUMN campaigns.consent_text IS 'Customizable consent text shown with checkbox. If null, uses default text.';
