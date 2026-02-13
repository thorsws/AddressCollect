-- Create global settings table for site-wide defaults
CREATE TABLE IF NOT EXISTS global_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id)
);

COMMENT ON TABLE global_settings IS 'Site-wide settings managed by super admins';

-- Insert default consent text
INSERT INTO global_settings (key, value, description) VALUES (
  'default_consent_text',
  'I consent to providing my information for this campaign. I understand my data will be used solely for this purpose, stored securely, and deleted within 60 days. I can request deletion at any time by contacting the organizer.',
  'Default consent checkbox text used when campaign does not have custom consent text'
) ON CONFLICT (key) DO NOTHING;

-- Insert default privacy blurb
INSERT INTO global_settings (key, value, description) VALUES (
  'default_privacy_blurb',
  'We only use your address to ship the book. We won''t sell your information.',
  'Default privacy blurb text used when campaign does not have custom privacy blurb'
) ON CONFLICT (key) DO NOTHING;
