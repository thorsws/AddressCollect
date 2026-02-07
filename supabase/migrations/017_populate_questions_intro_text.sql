-- Update campaigns with intro text for their questions
UPDATE campaigns
SET questions_intro_text = 'Please help us learn more about your use of AI'
WHERE slug = 'ai-future-raffle';

UPDATE campaigns
SET questions_intro_text = 'Help us understand how AI is impacting your work'
WHERE slug = 'staffing-industry';

UPDATE campaigns
SET questions_intro_text = 'Share your AI journey with us'
WHERE slug = 'sxsw';
