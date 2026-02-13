-- Add default_message field to admin_users for default gift message

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS default_message TEXT;

COMMENT ON COLUMN admin_users.default_message IS 'Default gift message shown to recipients, can be overridden per QR code';
