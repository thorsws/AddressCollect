-- Restore Haverford campaign privacy blurb

UPDATE campaigns
SET privacy_blurb = 'We only use your information to ship you the book if you win. We won''t sell your data or spam you.'
WHERE slug = 'haverford-raffle';
