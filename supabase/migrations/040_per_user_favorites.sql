-- Create per-user campaign favorites table
CREATE TABLE campaign_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, campaign_id)
);

CREATE INDEX idx_campaign_favorites_user ON campaign_favorites(user_id);
CREATE INDEX idx_campaign_favorites_campaign ON campaign_favorites(campaign_id);

-- Note: the old campaigns.is_favorited column is kept for now to avoid breaking
-- anything during deployment. It will be ignored by the code and can be removed later.
