-- Restore Haverford campaign description and privacy blurb that were lost

UPDATE campaigns
SET
  description = 'Hi Haverford! I''m Aidan, sophomore, men''s soccer player, and AI Innovation Intern at Taller Technologies. In partnership with Taller, I''m giving away 50 copies of **Cognitive Kin**, a book exploring how AI is reshaping our future. Whether you''re studying AI, curious about technology''s social impact, or just interested in the conversation - this raffle is for you!

**We''re raffling 50 books** - the more Haverford students who enter, the more perspectives we get to share. Enter your info below for a chance to win!',
  privacy_blurb = 'We only use your information to ship you the book if you win. We won''t sell your data or spam you.'
WHERE slug = 'haverford-raffle';
