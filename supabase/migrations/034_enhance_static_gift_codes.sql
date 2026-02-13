-- Enhance static gift codes to support multiple codes with different configurations

-- Remove unique constraint on (admin_id, campaign_id) to allow multiple codes
ALTER TABLE admin_gift_codes DROP CONSTRAINT IF EXISTS admin_gift_codes_admin_id_campaign_id_key;

-- Add configuration fields
ALTER TABLE admin_gift_codes ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE admin_gift_codes ADD COLUMN IF NOT EXISTS custom_message TEXT;
ALTER TABLE admin_gift_codes ADD COLUMN IF NOT EXISTS show_name BOOLEAN DEFAULT true;
ALTER TABLE admin_gift_codes ADD COLUMN IF NOT EXISTS show_linkedin BOOLEAN DEFAULT true;
ALTER TABLE admin_gift_codes ADD COLUMN IF NOT EXISTS show_bio BOOLEAN DEFAULT false;
ALTER TABLE admin_gift_codes ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT false;
ALTER TABLE admin_gift_codes ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT false;
ALTER TABLE admin_gift_codes ADD COLUMN IF NOT EXISTS custom_display_name TEXT;

COMMENT ON COLUMN admin_gift_codes.label IS 'Internal label for this QR code, e.g. "Conference booth", "LinkedIn version"';
COMMENT ON COLUMN admin_gift_codes.custom_message IS 'Custom greeting message shown to recipient';
COMMENT ON COLUMN admin_gift_codes.show_name IS 'Show gifter name to recipient';
COMMENT ON COLUMN admin_gift_codes.show_linkedin IS 'Show LinkedIn link to recipient';
COMMENT ON COLUMN admin_gift_codes.show_bio IS 'Show bio to recipient';
COMMENT ON COLUMN admin_gift_codes.show_phone IS 'Show phone number to recipient';
COMMENT ON COLUMN admin_gift_codes.show_email IS 'Show email to recipient';
COMMENT ON COLUMN admin_gift_codes.custom_display_name IS 'Override display name for this QR code';

-- Set default label for existing codes
UPDATE admin_gift_codes SET label = 'Default' WHERE label IS NULL;
