-- Add consent tracking to claims table
-- This ensures we have a record that users agreed to our terms

ALTER TABLE claims ADD COLUMN consent_given BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE claims ADD COLUMN consent_timestamp TIMESTAMPTZ;

COMMENT ON COLUMN claims.consent_given IS 'User explicitly agreed to terms and data collection';
COMMENT ON COLUMN claims.consent_timestamp IS 'When user gave consent';

-- Update existing claims to mark consent as given (they implicitly consented)
UPDATE claims SET consent_given = true, consent_timestamp = created_at WHERE consent_given = false;
