-- Add contact email fields to campaigns
-- These allow campaign owners to show a contact email on the campaign page

ALTER TABLE campaigns ADD COLUMN contact_email TEXT;
ALTER TABLE campaigns ADD COLUMN contact_text TEXT DEFAULT 'If you have any questions, please email';

-- Add comment for documentation
COMMENT ON COLUMN campaigns.contact_email IS 'Optional contact email shown on campaign page';
COMMENT ON COLUMN campaigns.contact_text IS 'Customizable text displayed before the contact email';
