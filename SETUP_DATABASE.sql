-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin OTP Requests table
CREATE TABLE admin_otp_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_hash TEXT
);

CREATE INDEX idx_admin_otp_requests_email ON admin_otp_requests(email);
CREATE INDEX idx_admin_otp_requests_expires_at ON admin_otp_requests(expires_at);

-- Admin Sessions table
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  session_token_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip_hash TEXT,
  user_agent TEXT
);

CREATE INDEX idx_admin_sessions_email ON admin_sessions(email);
CREATE INDEX idx_admin_sessions_token_hash ON admin_sessions(session_token_hash);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  capacity_total INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,

  -- Configuration fields
  require_email BOOLEAN DEFAULT false,
  require_email_verification BOOLEAN DEFAULT false,
  require_invite_code BOOLEAN DEFAULT false,
  show_scarcity BOOLEAN DEFAULT false,
  collect_company BOOLEAN DEFAULT false,
  collect_phone BOOLEAN DEFAULT false,
  collect_title BOOLEAN DEFAULT false,

  -- Privacy copy
  privacy_blurb TEXT,

  -- Anti-abuse
  max_claims_per_email INT DEFAULT 1,
  max_claims_per_ip_per_day INT DEFAULT 5,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_campaigns_is_active ON campaigns(is_active);

-- Invite Codes table
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  max_uses INT,
  uses INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invite_codes_campaign_id ON invite_codes(campaign_id);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE UNIQUE INDEX idx_invite_codes_campaign_code ON invite_codes(campaign_id, code);

-- Claims table
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, rejected, shipped
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,

  -- User fields
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  title TEXT,
  phone TEXT,

  -- Shipping address
  address1 TEXT NOT NULL,
  address2 TEXT,
  city TEXT NOT NULL,
  region TEXT NOT NULL, -- state/province
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',

  -- Invite code used
  invite_code TEXT,

  -- Dedup helpers
  email_normalized TEXT,
  address_fingerprint TEXT NOT NULL,

  -- Audit
  ip_hash TEXT,
  user_agent TEXT
);

CREATE INDEX idx_claims_campaign_id ON claims(campaign_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_email_normalized ON claims(email_normalized);
CREATE INDEX idx_claims_address_fingerprint ON claims(address_fingerprint);
CREATE INDEX idx_claims_created_at ON claims(created_at);

-- Email Verifications table
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_claim_id ON email_verifications(claim_id);
CREATE INDEX idx_email_verifications_token_hash ON email_verifications(token_hash);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for campaigns table
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Example seed data for testing

-- Insert a test campaign
INSERT INTO campaigns (
  slug,
  title,
  description,
  capacity_total,
  is_active,
  require_email,
  require_email_verification,
  require_invite_code,
  show_scarcity,
  collect_company,
  privacy_blurb
) VALUES (
  'stanford',
  'Stanford Book Giveaway',
  'Get your free copy of our book! We''ll ship it directly to you.',
  100,
  true,
  true,
  false,
  false,
  true,
  false,
  'We only use your address to ship the book. We won''t sell your information.'
);

-- Insert another test campaign with stricter requirements
INSERT INTO campaigns (
  slug,
  title,
  description,
  capacity_total,
  is_active,
  require_email,
  require_email_verification,
  require_invite_code,
  show_scarcity,
  collect_company,
  collect_phone,
  collect_title,
  privacy_blurb
) VALUES (
  'partner-event',
  'Partner Event Book Voucher',
  'Thanks for attending our partner event! Claim your book voucher.',
  50,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  'Your information is only used to fulfill your book voucher. We respect your privacy.'
);

-- Insert some invite codes for the partner-event campaign
INSERT INTO invite_codes (campaign_id, code, max_uses)
SELECT id, 'PARTNER2026', 25
FROM campaigns WHERE slug = 'partner-event';

INSERT INTO invite_codes (campaign_id, code, max_uses)
SELECT id, 'VIP2026', 10
FROM campaigns WHERE slug = 'partner-event';


-- ✅ DONE! All tables and test campaigns created.
