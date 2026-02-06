# Running Database Migrations

This guide explains how to create and apply database migrations for the AddressCollect project.

## Overview

Migrations are SQL files that modify your database schema. They're stored in `/supabase/migrations/` and numbered sequentially.

---

## Method 1: Supabase CLI (Recommended)

### Prerequisites

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Get your Personal Access Token**:
   - Go to: https://supabase.com/dashboard/account/tokens
   - Click "Generate new token"
   - Give it a name (e.g., "CLI Access")
   - Copy the token (starts with `sbp_`)
   - **Note:** Save this token securely - you won't see it again!

### Steps to Apply Migration

1. **Login to Supabase CLI**:
   ```bash
   echo "YOUR_ACCESS_TOKEN" | supabase login
   ```

   Replace `YOUR_ACCESS_TOKEN` with your token (e.g., `sbp_95fdc8d7e55fac7870d5a285d8644bc81d24b052`)

2. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

   Your project ref is in your Supabase URL: `https://[PROJECT_REF].supabase.co`

   For this project: `cqsmyqblrguejufewimo`

3. **Push migrations**:
   ```bash
   supabase db push
   ```

   This will:
   - Show you which migrations will be applied
   - Ask for confirmation (press Y)
   - Apply the migrations to your remote database
   - Update the migration history table

4. **Verify success**:
   ```bash
   supabase db push
   ```

   Should show: "Remote database is up to date"

### Common Issues

**"Unauthorized" error:**
- Your access token may have expired (they expire after some time)
- Generate a new token and login again

**"Database password required":**
- Some operations need the database password
- Get it from: Project Settings → Database → Database password
- Use: `SUPABASE_DB_PASSWORD=your_password supabase db push`

---

## Method 2: Supabase SQL Editor (Quick & Easy)

If you don't want to use the CLI, you can apply migrations directly in the dashboard:

1. **Open SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/cqsmyqblrguejufewimo/editor
   - Click "SQL Editor" in the left sidebar

2. **Create new query**:
   - Click "+ New query"

3. **Paste migration SQL**:
   - Open your migration file (e.g., `/supabase/migrations/003_add_test_mode_and_banner_fields.sql`)
   - Copy the entire SQL content
   - Paste into the SQL Editor

4. **Run the migration**:
   - Click "Run" button or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
   - Check for success message

5. **Verify changes**:
   - Click "Table Editor" in left sidebar
   - Select your table (e.g., `campaigns`)
   - Verify new columns appear

---

## Creating New Migrations

### Migration File Naming Convention

Format: `XXX_description.sql`
- `XXX` = Sequential number (001, 002, 003, etc.)
- `description` = Brief description using underscores
- Examples:
  - `001_initial_schema.sql`
  - `002_seed_data.sql`
  - `003_add_test_mode_and_banner_fields.sql`

### Using Supabase CLI to Generate Migration

```bash
supabase migration new add_your_feature_name
```

This creates a new timestamped migration file in `/supabase/migrations/`

### Manual Migration Creation

1. **Create the file**:
   ```bash
   touch supabase/migrations/004_your_migration_name.sql
   ```

2. **Write your SQL**:
   ```sql
   -- Add a new column
   ALTER TABLE your_table
     ADD COLUMN new_column_name TYPE DEFAULT value;

   -- Create an index
   CREATE INDEX idx_your_index_name ON your_table(column_name);

   -- Add a comment
   COMMENT ON COLUMN your_table.new_column_name IS 'Description of the column';
   ```

3. **Apply the migration** (see Method 1 or 2 above)

---

## Migration Best Practices

### 1. Always Add Comments

```sql
COMMENT ON COLUMN campaigns.test_mode IS 'When enabled, all new claims are marked as test claims';
```

This helps future developers understand the purpose of fields.

### 2. Use NOT NULL with Defaults

```sql
ALTER TABLE campaigns
  ADD COLUMN test_mode BOOLEAN DEFAULT false NOT NULL;
```

This ensures existing rows get a default value.

### 3. Add Indexes for Query Performance

```sql
CREATE INDEX idx_claims_is_test_claim ON claims(is_test_claim);
```

Add indexes on columns you'll frequently filter by.

### 4. Test Migrations Locally First

If using Supabase local development:
```bash
supabase start
supabase db reset  # Applies all migrations
```

### 5. Never Edit Applied Migrations

Once a migration is applied to production, create a new migration to make changes.

❌ **Don't do this:**
```
Edit: 003_add_test_mode.sql
```

✅ **Do this instead:**
```
Create: 004_modify_test_mode.sql
```

---

## Rollback Migrations

Supabase CLI doesn't have automatic rollback. To undo a migration:

1. **Create a new "rollback" migration**:
   ```bash
   supabase migration new rollback_test_mode_feature
   ```

2. **Write SQL to reverse changes**:
   ```sql
   -- Drop columns
   ALTER TABLE campaigns DROP COLUMN IF EXISTS test_mode;
   ALTER TABLE claims DROP COLUMN IF EXISTS is_test_claim;

   -- Drop indexes
   DROP INDEX IF EXISTS idx_claims_is_test_claim;
   ```

3. **Apply the rollback migration** (see Method 1 or 2 above)

---

## Project-Specific Information

### Current Project Details

- **Project Ref**: `cqsmyqblrguejufewimo`
- **Supabase URL**: `https://cqsmyqblrguejufewimo.supabase.co`
- **Migrations Directory**: `/supabase/migrations/`
- **Admin Email**: `jan.a.rosen@gmail.com` (from .env.local)

### Current Migrations

1. `001_initial_schema.sql` - Base schema with all tables
2. `002_seed_data.sql` - Sample campaign data
3. `003_add_test_mode_and_banner_fields.sql` - Test mode and banner features

### Database Tables

- `campaigns` - Campaign configurations
- `claims` - Address submissions
- `admin_sessions` - Admin session management
- `admin_otp_requests` - OTP authentication
- `invite_codes` - Campaign invite codes
- `email_verifications` - Email verification tokens

---

## Troubleshooting

### "Migration already applied"

```
Remote database is up to date.
```

This is normal - the migration was already applied. No action needed.

### "Syntax error in SQL"

- Check your SQL syntax
- Test in SQL Editor first
- Make sure you don't have trailing semicolons issues

### "Permission denied"

- Your access token may lack permissions
- Generate a new token with full access
- Or use SQL Editor (requires project owner access)

### "Connection timeout"

- Check your internet connection
- Supabase service may be down (check status.supabase.com)
- Try again in a few minutes

---

## Quick Reference

### Authentication Flow
```bash
# 1. Login
echo "sbp_YOUR_TOKEN" | supabase login

# 2. Link project
supabase link --project-ref cqsmyqblrguejufewimo

# 3. Push migrations
supabase db push
```

### Check Migration Status
```bash
supabase db push --dry-run
```

Shows what would be applied without actually applying it.

### View Applied Migrations

In Supabase dashboard:
1. Go to Table Editor
2. Find table: `supabase_migrations.schema_migrations`
3. View all applied migrations with timestamps

---

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli/introduction)
- [Database Migrations Guide](https://supabase.com/docs/guides/deployment/database-migrations)
- [SQL Editor Guide](https://supabase.com/docs/guides/database/overview)
- [Managing Access Tokens](https://supabase.com/dashboard/account/tokens)

---

## Example: Complete Migration Workflow

Here's a complete example of adding a new feature:

```bash
# 1. Create migration file
supabase migration new add_campaign_tags

# 2. Edit the file: supabase/migrations/004_add_campaign_tags.sql
```

```sql
-- Add tags column to campaigns
ALTER TABLE campaigns
  ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index for tag searches
CREATE INDEX idx_campaigns_tags ON campaigns USING GIN(tags);

-- Add comment
COMMENT ON COLUMN campaigns.tags IS 'Array of tags for categorizing campaigns';
```

```bash
# 3. Apply migration
supabase db push

# 4. Verify in SQL Editor or Table Editor
# Check that campaigns table now has 'tags' column

# 5. Update TypeScript types (if needed)
# Edit app files to add tags: string[] to Campaign interface

# 6. Commit to git
git add supabase/migrations/004_add_campaign_tags.sql
git commit -m "Add campaign tags feature"
```

---

**Last Updated**: February 2026
**Maintainer**: Development Team
