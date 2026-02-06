-- Add test mode and banner fields to campaigns and claims
-- This migration adds:
-- 1. test_mode flag to campaigns
-- 2. is_test_claim flag to claims (test claims don't count toward capacity)
-- 3. show_banner and banner_url fields to campaigns for Open Graph preview banners

-- Add test_mode to campaigns
ALTER TABLE campaigns
  ADD COLUMN test_mode BOOLEAN DEFAULT false NOT NULL;

-- Add is_test_claim to claims
ALTER TABLE claims
  ADD COLUMN is_test_claim BOOLEAN DEFAULT false NOT NULL;

-- Add banner fields to campaigns
ALTER TABLE campaigns
  ADD COLUMN show_banner BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN banner_url TEXT;

-- Add index for performance on test claim queries
CREATE INDEX idx_claims_is_test_claim ON claims(is_test_claim);

-- Add comments for documentation
COMMENT ON COLUMN campaigns.test_mode IS 'When enabled, all new claims are marked as test claims and do not count toward capacity';
COMMENT ON COLUMN claims.is_test_claim IS 'Test claims do not count toward campaign capacity';
COMMENT ON COLUMN campaigns.show_banner IS 'Display an Open Graph preview banner on the public campaign page';
COMMENT ON COLUMN campaigns.banner_url IS 'URL to fetch Open Graph metadata from';
