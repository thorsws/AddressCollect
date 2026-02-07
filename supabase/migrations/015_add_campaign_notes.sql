-- Add internal notes field to campaigns for admin use only
-- This field will not be displayed on public campaign pages

ALTER TABLE campaigns
ADD COLUMN notes TEXT;

COMMENT ON COLUMN campaigns.notes IS 'Internal notes for admins - not displayed on public pages';
