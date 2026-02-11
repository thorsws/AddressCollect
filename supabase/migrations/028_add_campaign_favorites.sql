-- Add is_favorited column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_favorited BOOLEAN DEFAULT false;

COMMENT ON COLUMN campaigns.is_favorited IS 'Whether this campaign is marked as a favorite for priority display';

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_campaigns_sort_order ON campaigns (is_favorited DESC, is_active DESC, created_at DESC);
