-- Add enable_questions field to campaigns table
-- This controls whether custom questions are shown on the campaign form

ALTER TABLE campaigns
ADD COLUMN enable_questions BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN campaigns.enable_questions IS 'Whether custom questions are enabled for this campaign';
