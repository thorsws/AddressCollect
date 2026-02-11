-- Add phone number to admin_users for gifter contact info
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN admin_users.phone IS 'Phone number shown to gift recipients';

-- Add gift visibility flags to claims
-- These control what gifter info is shown for each gift
ALTER TABLE claims ADD COLUMN IF NOT EXISTS gift_show_email BOOLEAN DEFAULT false;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS gift_show_phone BOOLEAN DEFAULT false;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS gift_show_linkedin BOOLEAN DEFAULT true;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS gift_show_bio BOOLEAN DEFAULT false;

COMMENT ON COLUMN claims.gift_show_email IS 'Show gifter email in this gift';
COMMENT ON COLUMN claims.gift_show_phone IS 'Show gifter phone in this gift';
COMMENT ON COLUMN claims.gift_show_linkedin IS 'Show gifter LinkedIn in this gift';
COMMENT ON COLUMN claims.gift_show_bio IS 'Show gifter bio in this gift';
