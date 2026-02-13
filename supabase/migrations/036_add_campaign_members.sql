-- Add campaign_members table for per-campaign permissions
-- Allows campaign owners to invite other admins with different roles

CREATE TABLE IF NOT EXISTS campaign_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign ON campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_user ON campaign_members(user_id);

COMMENT ON TABLE campaign_members IS 'Per-campaign permissions for admin users';
COMMENT ON COLUMN campaign_members.role IS 'owner: full control, editor: can edit/gift, viewer: read-only';

-- Migrate existing campaign owners to campaign_members
-- The created_by user becomes an owner
INSERT INTO campaign_members (campaign_id, user_id, role, invited_by)
SELECT c.id, c.created_by, 'owner', c.created_by
FROM campaigns c
WHERE c.created_by IS NOT NULL
ON CONFLICT (campaign_id, user_id) DO NOTHING;
