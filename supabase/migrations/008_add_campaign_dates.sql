-- Add start and end date fields for campaigns
ALTER TABLE campaigns ADD COLUMN starts_at TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN ends_at TIMESTAMPTZ;

COMMENT ON COLUMN campaigns.starts_at IS 'Campaign becomes active at this time (optional)';
COMMENT ON COLUMN campaigns.ends_at IS 'Campaign closes at this time (optional, useful for raffles)';
