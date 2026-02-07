-- Add max_claims_per_address setting to campaigns table
-- This allows multiple people at the same physical address to submit claims
-- Default is 1 (existing behavior), but can be increased for households/roommates

ALTER TABLE campaigns
ADD COLUMN max_claims_per_address INTEGER DEFAULT 1 NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN campaigns.max_claims_per_address IS 'Maximum number of claims allowed from the same physical address (for roommates, family members, etc.)';

-- Update existing campaigns to allow up to 3 people per address by default
-- This is a reasonable default for most household situations
UPDATE campaigns SET max_claims_per_address = 3;
