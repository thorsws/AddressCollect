-- Add is_lead flag to claims for distinguishing potential business leads
ALTER TABLE claims ADD COLUMN IF NOT EXISTS is_lead BOOLEAN NOT NULL DEFAULT false;

-- Index for quick filtering
CREATE INDEX IF NOT EXISTS idx_claims_is_lead ON claims(is_lead) WHERE is_lead = true;
