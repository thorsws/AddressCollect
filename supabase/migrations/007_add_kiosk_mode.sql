-- Add kiosk_mode flag for iPad/tablet collection scenarios
ALTER TABLE campaigns ADD COLUMN kiosk_mode BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN campaigns.kiosk_mode IS 'When enabled, shows a button to submit another entry after successful submission (for shared device scenarios)';
