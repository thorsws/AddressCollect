-- Add show_privacy_blurb toggle to campaigns
-- Allows admins to hide the privacy blurb section entirely

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS show_privacy_blurb BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN campaigns.show_privacy_blurb IS 'Whether to show the privacy blurb section on the campaign page';
