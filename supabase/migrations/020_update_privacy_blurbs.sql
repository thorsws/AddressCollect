-- Update all existing campaigns with comprehensive privacy blurb
-- This ensures all campaigns have proper privacy language including:
-- - Clear data usage statement
-- - Data retention policy (60 days)
-- - No cookies/tracking disclosure
-- - Data deletion rights

UPDATE campaigns
SET privacy_blurb = 'Your information is used solely for this giveaway. We collect only what''s needed to ship your book. Your data is stored securely, never sold or shared, and will be deleted within 60 days after books are shipped. We don''t use cookies or tracking. Contact us anytime to request data deletion.'
WHERE privacy_blurb IS NULL
   OR privacy_blurb = 'We only use your information to fulfill your request. We won''t sell your data.'
   OR privacy_blurb = 'We only use your address to ship the book. We won''t sell your information.';

-- Note: This updates campaigns with the old default blurb or NULL blurb
-- Campaigns with custom privacy blurbs will NOT be changed
