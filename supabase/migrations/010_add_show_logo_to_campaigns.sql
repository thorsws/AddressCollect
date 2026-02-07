-- Add show_logo field to campaigns table
-- Allows admins to optionally display the Cognitive Kin logo on their campaign pages

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS show_logo BOOLEAN DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_show_logo ON campaigns(show_logo);

COMMENT ON COLUMN campaigns.show_logo IS 'Whether to display the Cognitive Kin logo on the campaign landing page';
