-- Add questions intro text field to campaigns table
-- This allows admins to customize the introductory text shown above custom questions

ALTER TABLE campaigns ADD COLUMN questions_intro_text TEXT;

COMMENT ON COLUMN campaigns.questions_intro_text IS 'Optional introductory text displayed above custom questions on the campaign form';
