-- Add pre-claim functionality and shipping tracking
-- Migration 005: Add claim tokens, admin notes, shipped tracking

-- Add claim_token for unique pre-created claim URLs
ALTER TABLE claims ADD COLUMN claim_token VARCHAR(64) UNIQUE;

-- Add admin notes (private, not visible to claimants)
ALTER TABLE claims ADD COLUMN admin_notes TEXT;

-- Add shipped tracking
ALTER TABLE claims ADD COLUMN shipped_at TIMESTAMPTZ;

-- Add pre_created_by to track which admin pre-created the claim
ALTER TABLE claims ADD COLUMN pre_created_by UUID REFERENCES admin_users(id);

-- Create index on claim_token for fast lookups
CREATE INDEX idx_claims_claim_token ON claims(claim_token);

-- Create index on pre_created_by
CREATE INDEX idx_claims_pre_created_by ON claims(pre_created_by);

-- Add comments for documentation
COMMENT ON COLUMN claims.claim_token IS 'Unique token for pre-created claims. Used to generate shareable URLs with prefilled data.';
COMMENT ON COLUMN claims.admin_notes IS 'Private notes only visible to admins. Not shown to claimants.';
COMMENT ON COLUMN claims.shipped_at IS 'Timestamp when the item was marked as shipped. Independent of claim status.';
COMMENT ON COLUMN claims.pre_created_by IS 'Admin user who pre-created this claim. NULL if claim was submitted directly by user.';
