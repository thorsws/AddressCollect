-- Campaign version history for audit trail, draft/publish workflow, and revert capability
CREATE TABLE IF NOT EXISTS campaign_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),

  -- Snapshot of campaign data at this version
  data JSONB NOT NULL,

  -- What changed in this version
  change_summary TEXT,

  -- Audit fields
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES admin_users(id),

  UNIQUE(campaign_id, version_number)
);

-- Index for fast lookups
CREATE INDEX idx_campaign_versions_campaign_id ON campaign_versions(campaign_id);
CREATE INDEX idx_campaign_versions_status ON campaign_versions(status);
CREATE INDEX idx_campaign_versions_created_at ON campaign_versions(created_at DESC);

COMMENT ON TABLE campaign_versions IS 'Stores version history of campaigns for audit trail and revert capability';
COMMENT ON COLUMN campaign_versions.data IS 'Full JSONB snapshot of campaign fields at this version';
COMMENT ON COLUMN campaign_versions.status IS 'draft = unpublished changes, published = live version';
COMMENT ON COLUMN campaign_versions.change_summary IS 'Optional description of what changed in this version';

-- Add current_version to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS has_draft BOOLEAN DEFAULT false;

COMMENT ON COLUMN campaigns.current_version IS 'Current published version number';
COMMENT ON COLUMN campaigns.has_draft IS 'True if there are unpublished draft changes';

-- Create initial version for all existing campaigns
INSERT INTO campaign_versions (campaign_id, version_number, status, data, change_summary, created_at, published_at)
SELECT
  id,
  1,
  'published',
  jsonb_build_object(
    'title', title,
    'internal_title', internal_title,
    'slug', slug,
    'description', description,
    'capacity_total', capacity_total,
    'is_active', is_active,
    'require_email', require_email,
    'require_email_verification', require_email_verification,
    'require_invite_code', require_invite_code,
    'show_scarcity', show_scarcity,
    'collect_company', collect_company,
    'collect_phone', collect_phone,
    'collect_title', collect_title,
    'privacy_blurb', privacy_blurb,
    'max_claims_per_email', max_claims_per_email,
    'max_claims_per_ip_per_day', max_claims_per_ip_per_day,
    'max_claims_per_address', max_claims_per_address,
    'test_mode', test_mode,
    'show_banner', show_banner,
    'show_logo', show_logo,
    'banner_url', banner_url,
    'contact_email', contact_email,
    'contact_text', contact_text,
    'kiosk_mode', kiosk_mode,
    'enable_questions', enable_questions,
    'questions_intro_text', questions_intro_text,
    'starts_at', starts_at,
    'ends_at', ends_at,
    'notes', notes,
    'consent_text', consent_text
  ),
  'Initial version (migrated from existing data)',
  created_at,
  created_at
FROM campaigns
WHERE NOT EXISTS (
  SELECT 1 FROM campaign_versions cv WHERE cv.campaign_id = campaigns.id
);
