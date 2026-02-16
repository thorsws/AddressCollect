-- Add show_in_leaderboard flag to campaigns
-- Allows super admins to control which campaigns appear on the dashboard leaderboard

ALTER TABLE campaigns
  ADD COLUMN show_in_leaderboard BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN campaigns.show_in_leaderboard IS 'Whether this campaign appears in the dashboard leaderboard';

-- Add is_hidden flag to campaigns
-- Allows super admins to hide campaigns from non-super-admin users

ALTER TABLE campaigns
  ADD COLUMN is_hidden BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN campaigns.is_hidden IS 'When true, only super admins can see this campaign on the dashboard';
