-- Create Haverford College Raffle Campaign

-- Insert the campaign
INSERT INTO campaigns (
  slug,
  title,
  internal_title,
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
  enable_questions,
  questions_intro_text,
  privacy_blurb,
  max_claims_per_email,
  max_claims_per_ip_per_day,
  test_mode,
  show_banner,
  banner_url,
  show_logo,
  contact_email,
  contact_text
) VALUES (
  'haverford-raffle',
  'Win a Free Copy of Cognitive Kin - Haverford College',
  'Haverford College - Aidan''s Raffle',
  'Aidan, a Haverford College sophomore, men''s soccer team member, and AI Innovation Intern at Taller Technologies, is giving away 50 free copies of "Cognitive Kin" to fellow students!

This book explores the future of AI and how it''s reshaping our world. Whether you''re studying AI, curious about technology''s impact on society, or just love a good read about the future - enter for your chance to win!

**We''re raffling out 50 books** - the more students who enter, the more perspectives we can share!',
  10000, -- High capacity for raffle mode (effectively unlimited)
  true, -- is_active
  true, -- require_email
  true, -- require_email_verification
  false, -- require_invite_code
  false, -- show_scarcity (don't show count for raffle)
  false, -- collect_company
  false, -- collect_phone
  false, -- collect_title
  true, -- enable_questions
  'Help us understand the Haverford community''s interest in AI',
  'We only use your information to ship you the book if you win. We won''t sell your data or spam you.',
  1, -- max_claims_per_email
  5, -- max_claims_per_ip_per_day
  false, -- test_mode
  true, -- show_banner
  'https://cognitivekin.com',
  true, -- show_logo
  'jan.a.rosen@gmail.com',
  'Questions? Email'
);

-- Get the campaign ID for adding questions
DO $$
DECLARE
  campaign_id_var UUID;
BEGIN
  SELECT id INTO campaign_id_var FROM campaigns WHERE slug = 'haverford-raffle';

  -- Question 1: What year are you?
  INSERT INTO campaign_questions (
    campaign_id,
    question_text,
    question_type,
    is_required,
    options,
    display_order
  ) VALUES (
    campaign_id_var,
    'What year are you at Haverford?',
    'multiple_choice',
    true,
    '["First Year", "Sophomore", "Junior", "Senior", "Graduate Student", "Other"]'::jsonb,
    1
  );

  -- Question 2: What's your major/field?
  INSERT INTO campaign_questions (
    campaign_id,
    question_text,
    question_type,
    is_required,
    options,
    display_order
  ) VALUES (
    campaign_id_var,
    'What are you studying? (Major/Minor)',
    'text',
    false,
    NULL,
    2
  );

  -- Question 3: AI interest
  INSERT INTO campaign_questions (
    campaign_id,
    question_text,
    question_type,
    is_required,
    options,
    display_order
  ) VALUES (
    campaign_id_var,
    'How do you use or think about AI?',
    'checkboxes',
    false,
    '["I use AI tools for schoolwork", "I''m studying AI/CS", "I''m curious about AI''s social impact", "I use AI for creative projects", "I''m concerned about AI ethics", "I don''t use AI much yet"]'::jsonb,
    3
  );
END $$;
