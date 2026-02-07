-- Add internal_title field to campaigns table
-- The existing 'title' field is the external/public title
-- The new 'internal_title' field is for internal admin use

ALTER TABLE campaigns
ADD COLUMN internal_title TEXT;

-- Set internal_title to same as title for existing campaigns
UPDATE campaigns
SET internal_title = title
WHERE internal_title IS NULL;

-- Make internal_title NOT NULL after populating
ALTER TABLE campaigns
ALTER COLUMN internal_title SET NOT NULL;

COMMENT ON COLUMN campaigns.title IS 'External/public-facing campaign title shown to users';
COMMENT ON COLUMN campaigns.internal_title IS 'Internal campaign title shown only in admin interface';
