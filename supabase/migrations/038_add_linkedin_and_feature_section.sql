-- Add LinkedIn collection and feature section to campaigns
-- Migration: 038_add_linkedin_and_feature_section.sql

-- Add new columns to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS collect_linkedin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_feature_section BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_image_url TEXT,
ADD COLUMN IF NOT EXISTS feature_paragraph TEXT;

-- Add linkedin_url to claims table
ALTER TABLE claims
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN campaigns.collect_linkedin IS 'Whether to collect LinkedIn profile URL from users';
COMMENT ON COLUMN campaigns.show_feature_section IS 'Whether to show a featured image/paragraph section after the logo';
COMMENT ON COLUMN campaigns.feature_image_url IS 'URL of the featured image (e.g., client photo)';
COMMENT ON COLUMN campaigns.feature_paragraph IS 'Paragraph text to display with the featured image';
COMMENT ON COLUMN claims.linkedin_url IS 'LinkedIn profile URL provided by the user';
