-- Set all existing campaigns to be created by jan.a.rosen@gmail.com
-- This retroactively assigns ownership to the primary admin who created all campaigns

UPDATE campaigns
SET created_by = (
  SELECT id FROM admin_users WHERE email = 'jan.a.rosen@gmail.com' LIMIT 1
),
updated_by = (
  SELECT id FROM admin_users WHERE email = 'jan.a.rosen@gmail.com' LIMIT 1
)
WHERE created_by IS NULL;

-- Show results
SELECT COUNT(*) as updated_campaigns FROM campaigns
WHERE created_by = (SELECT id FROM admin_users WHERE email = 'jan.a.rosen@gmail.com' LIMIT 1);
