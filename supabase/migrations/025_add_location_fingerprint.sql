-- Add location_fingerprint to track physical address without person name
-- This allows counting how many different people are at the same address
-- while still preventing the same person from claiming twice

ALTER TABLE claims
ADD COLUMN location_fingerprint TEXT;

-- Create index for efficient lookups
CREATE INDEX idx_claims_location_fingerprint ON claims(campaign_id, location_fingerprint);

-- Add helpful comment
COMMENT ON COLUMN claims.location_fingerprint IS 'Hash of address only (without name) - used to count multiple people at same address';

-- Note: Existing claims will have NULL location_fingerprint
-- This is fine - they will be recalculated on next update or can be backfilled if needed
