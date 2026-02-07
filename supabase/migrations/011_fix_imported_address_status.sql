-- Fix imported addresses that were incorrectly set to status='shipped'
-- These should all be status='confirmed' with shipped_at tracking when they were sent

-- Update all claims that have shipped_at but wrong status
-- This will fix historical imports that were set to 'shipped' instead of 'confirmed'
UPDATE claims
SET status = 'confirmed'
WHERE status = 'shipped'
  AND address1 IS NOT NULL; -- Only update claims with actual addresses (not pre-created)
