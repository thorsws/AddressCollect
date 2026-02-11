-- Add in-person gifting feature
-- Adds profile fields to admin_users for gifter info
-- Adds gift note fields to claims

-- Add profile fields to admin_users for gifter info
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS bio TEXT;

COMMENT ON COLUMN admin_users.display_name IS 'Public display name for gifting (defaults to name if null)';
COMMENT ON COLUMN admin_users.linkedin_url IS 'LinkedIn profile URL shown to gift recipients';
COMMENT ON COLUMN admin_users.bio IS 'Short bio shown to gift recipients';

-- Add gifting fields to claims table
ALTER TABLE claims ADD COLUMN IF NOT EXISTS gift_note_to_recipient TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS gift_note_private TEXT;

COMMENT ON COLUMN claims.gift_note_to_recipient IS 'Personal note from gifter shown to recipient on form and in email';
COMMENT ON COLUMN claims.gift_note_private IS 'Private admin note about this gift (not shown to recipient)';

-- Note: claims.pre_created_by already exists from migration 005 and references admin_users(id)
