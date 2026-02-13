-- Update all campaigns to be owned by jan.rosen@tallertechnologies.com
UPDATE campaigns
SET created_by = (
  SELECT id FROM admin_users WHERE email = 'jan.rosen@tallertechnologies.com' LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM admin_users WHERE email = 'jan.rosen@tallertechnologies.com'
);
