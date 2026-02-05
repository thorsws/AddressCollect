-- Example seed data for testing

-- Insert a test campaign
INSERT INTO campaigns (
  slug,
  title,
  description,
  capacity_total,
  is_active,
  require_email,
  require_email_verification,
  require_invite_code,
  show_scarcity,
  collect_company,
  privacy_blurb
) VALUES (
  'stanford',
  'Stanford Book Giveaway',
  'Get your free copy of our book! We''ll ship it directly to you.',
  100,
  true,
  true,
  false,
  false,
  true,
  false,
  'We only use your address to ship the book. We won''t sell your information.'
);

-- Insert another test campaign with stricter requirements
INSERT INTO campaigns (
  slug,
  title,
  description,
  capacity_total,
  is_active,
  require_email,
  require_email_verification,
  require_invite_code,
  show_scarcity,
  collect_company,
  collect_phone,
  collect_title,
  privacy_blurb
) VALUES (
  'partner-event',
  'Partner Event Book Voucher',
  'Thanks for attending our partner event! Claim your book voucher.',
  50,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  'Your information is only used to fulfill your book voucher. We respect your privacy.'
);

-- Insert some invite codes for the partner-event campaign
INSERT INTO invite_codes (campaign_id, code, max_uses)
SELECT id, 'PARTNER2026', 25
FROM campaigns WHERE slug = 'partner-event';

INSERT INTO invite_codes (campaign_id, code, max_uses)
SELECT id, 'VIP2026', 10
FROM campaigns WHERE slug = 'partner-event';
