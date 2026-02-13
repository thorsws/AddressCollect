-- Static gift codes - permanent QR codes per admin per campaign
-- Uses admin's profile info for gifter display
CREATE TABLE IF NOT EXISTS admin_gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each admin can only have one static code per campaign
  UNIQUE(admin_id, campaign_id)
);

CREATE INDEX idx_admin_gift_codes_code ON admin_gift_codes(code);
CREATE INDEX idx_admin_gift_codes_admin ON admin_gift_codes(admin_id);

COMMENT ON TABLE admin_gift_codes IS 'Static gift codes - permanent QR codes that use admin profile for gifter info';
COMMENT ON COLUMN admin_gift_codes.code IS 'Unique code used in URL, e.g. /c/slug/gift/CODE';
