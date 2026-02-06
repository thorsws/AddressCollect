-- Add multi-user admin system with roles
-- This migration adds:
-- 1. admin_users table with roles (super_admin, admin, viewer)
-- 2. Campaign ownership tracking (created_by, updated_by)
-- 3. Invite code creator tracking
-- 4. Session linking to users

-- Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'viewer')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_by UUID REFERENCES admin_users(id)
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);

COMMENT ON TABLE admin_users IS 'Admin users with role-based permissions';
COMMENT ON COLUMN admin_users.role IS 'User role: super_admin (full access), admin (create/edit own campaigns), viewer (read-only)';
COMMENT ON COLUMN admin_users.is_active IS 'Whether the user can log in';

-- Update admin_sessions to link to users
ALTER TABLE admin_sessions ADD COLUMN user_id UUID REFERENCES admin_users(id);
CREATE INDEX idx_admin_sessions_user_id ON admin_sessions(user_id);

-- Update campaigns to track ownership
ALTER TABLE campaigns ADD COLUMN created_by UUID REFERENCES admin_users(id);
ALTER TABLE campaigns ADD COLUMN updated_by UUID REFERENCES admin_users(id);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);

COMMENT ON COLUMN campaigns.created_by IS 'Admin user who created this campaign';
COMMENT ON COLUMN campaigns.updated_by IS 'Admin user who last updated this campaign';

-- Update invite_codes to track creator
ALTER TABLE invite_codes ADD COLUMN created_by UUID REFERENCES admin_users(id);
CREATE INDEX idx_invite_codes_created_by ON invite_codes(created_by);

COMMENT ON COLUMN invite_codes.created_by IS 'Admin user who created this invite code';

-- Seed initial super_admin
-- Note: Adjust email to match your ADMIN_EMAIL_ALLOWLIST
INSERT INTO admin_users (email, name, role, is_active)
VALUES ('jan.a.rosen@gmail.com', 'Jan Rosen', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;

-- Update existing sessions to link to the super admin user
UPDATE admin_sessions
SET user_id = (SELECT id FROM admin_users WHERE email = 'jan.a.rosen@gmail.com')
WHERE user_id IS NULL AND email = 'jan.a.rosen@gmail.com';
