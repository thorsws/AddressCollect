# Database Setup Guide

This document explains how to set up and manage the Supabase PostgreSQL database for the Address Collection Campaign system.

## Overview

The application uses **Supabase PostgreSQL** for data storage, but **does NOT use Supabase Auth**. Instead, we implement custom OTP-based authentication for admin access.

## Database Architecture

### Database Access Roles

Supabase PostgreSQL has three main roles:

| Role | What it is | Are we using it? |
|------|-----------|------------------|
| `postgres` | Database owner/superuser | ❌ No (internal use only) |
| `service_role` | Server-side admin role | ✅ Yes (via SUPABASE_KEY) |
| `anon` | Public browser role | ❌ No (we don't use Supabase Auth) |

**Important**: Our application accesses the database exclusively through the `service_role` using the `SUPABASE_KEY`. This gives us full database access from server-side code without needing Supabase Auth.

### Tables

The database consists of 6 main tables:

1. **admin_otp_requests** - Stores OTP codes for admin login
2. **admin_sessions** - Active admin sessions
3. **campaigns** - Campaign configurations
4. **claims** - Address submissions from users
5. **invite_codes** - Invite codes for restricted campaigns
6. **email_verifications** - Email verification tokens for claimants

## Prerequisites

### 1. Install Supabase CLI

**macOS (via Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Other platforms:**
See [Supabase CLI Getting Started](https://supabase.com/docs/guides/local-development/cli/getting-started)

### 2. Get Your Supabase Credentials

From your Supabase project dashboard, collect:

1. **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - Format: `https://[project-ref].supabase.co`
   - Example: `https://cqsmyqblrguejufewimo.supabase.co`

2. **Service Role Key** (`SUPABASE_KEY`)
   - Go to: Settings → API → Project API keys
   - Copy the `service_role` key (starts with `eyJ...` or `sb_secret_...`)
   - ⚠️ **Never expose this to the browser** - server-side only!

3. **Project Reference ID**
   - Found in Settings → General
   - Example: `cqsmyqblrguejufewimo`

4. **Database Password** (optional, for direct PostgreSQL access)
   - Go to: Settings → Database
   - Look for "Database password" or reset it

### 3. Get a Supabase Access Token

For CLI operations, you need a personal access token:

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Give it a name (e.g., "CLI Access")
4. Copy the token (starts with `sbp_...`)
5. Save it securely - you'll need it for CLI login

## Initial Setup

### 1. Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_KEY=[your-service-role-key]

# Admin Configuration
ADMIN_EMAIL_ALLOWLIST=your-email@example.com,another@example.com
ADMIN_SESSION_TTL_DAYS=7

# Mailgun Configuration (for OTP emails)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_FROM_EMAIL=noreply@your_domain.com

# Application
APP_BASE_URL=http://localhost:3000
```

### 2. Login to Supabase CLI

```bash
supabase login --token sbp_your_access_token_here
```

You should see: "You are now logged in. Happy coding!"

### 3. Initialize Supabase in Your Repo

If not already done:

```bash
supabase init
```

This creates a `supabase/` folder with:
- `config.toml` - Local development configuration
- `migrations/` - SQL migration files

### 4. Link Your Project

```bash
supabase link --project-ref your-project-ref
```

Example:
```bash
supabase link --project-ref cqsmyqblrguejufewimo
```

### 5. Push Migrations to Database

This creates all tables and loads seed data:

```bash
supabase db push --include-seed
```

The CLI will show:
- Which migrations will be applied
- Ask for confirmation
- Apply the migrations in order
- Load seed data

### 6. Verify Database Setup

Run the verification script:

```bash
node scripts/check-db.js
```

Expected output:
```
✅ admin_otp_requests - EXISTS (0 rows)
✅ admin_sessions - EXISTS (0 rows)
✅ campaigns - EXISTS (2 rows)
✅ claims - EXISTS (0 rows)
✅ invite_codes - EXISTS (2 rows)
✅ email_verifications - EXISTS (0 rows)
```

## Database Migrations

### Migration Files

Located in `supabase/migrations/`:

1. **001_initial_schema.sql** - Creates all tables, indexes, and triggers
2. **002_seed_data.sql** - Adds test campaigns and invite codes

### Creating New Migrations

To add new database changes:

```bash
supabase migration new your_migration_name
```

This creates a new file: `supabase/migrations/[timestamp]_your_migration_name.sql`

Edit the file to add your SQL changes, then push:

```bash
supabase db push
```

### Important Migration Notes

1. **Always use `gen_random_uuid()`** for UUID defaults, not `uuid_generate_v4()`
2. **Include the pgcrypto extension** at the top of migrations:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```
3. **Use transaction-safe SQL** - migrations run in transactions
4. **Test locally first** before pushing to production

## Schema Management

### Reloading the PostgREST Schema Cache

After creating tables via SQL Editor (not via migrations), the Supabase API might not see them immediately. To reload:

**Option 1: Via SQL Editor**
```sql
NOTIFY pgrst, 'reload schema';
```

**Option 2: Via script**
```bash
node scripts/reload-schema.js
```

**Option 3: Automatic**
Supabase typically auto-reloads when tables are created via the dashboard or migrations.

Reference: [Supabase PostgREST Schema Reload](https://supabase.com/docs/guides/troubleshooting/refresh-postgrest-schema)

## Seed Data

### Test Campaigns

The seed data includes two test campaigns:

1. **Stanford Book Giveaway** (`/c/stanford`)
   - Capacity: 100
   - Requires email (no verification)
   - No invite code required
   - Shows scarcity

2. **Partner Event Book Voucher** (`/c/partner-event`)
   - Capacity: 50
   - Requires email with verification
   - Requires invite code
   - Collects company, phone, title
   - Shows scarcity

### Invite Codes

For the Partner Event campaign:
- `PARTNER2026` - 25 uses
- `VIP2026` - 10 uses

## Common Tasks

### Adding a New Campaign

**Via Admin Dashboard:**
1. Login at http://localhost:3000/admin/login
2. Click "Create Campaign"
3. Fill in the form
4. Submit

**Via SQL:**
```sql
INSERT INTO campaigns (
  slug, title, description, capacity_total,
  is_active, require_email, show_scarcity
) VALUES (
  'my-campaign',
  'My Campaign Title',
  'Campaign description',
  100,
  true,
  true,
  true
);
```

### Viewing All Addresses

**Via Admin Dashboard:**
http://localhost:3000/admin/addresses

**Via SQL:**
```sql
SELECT
  c.first_name,
  c.last_name,
  c.email,
  c.address1,
  c.city,
  c.region,
  c.postal_code,
  c.country,
  camp.title as campaign
FROM claims c
JOIN campaigns camp ON c.campaign_id = camp.id
WHERE c.status = 'confirmed'
ORDER BY c.created_at DESC;
```

### Exporting Data to CSV

**Via Admin Dashboard:**
1. Go to http://localhost:3000/admin/addresses
2. Click "Export CSV"

**Via psql:**
```bash
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  -c "COPY (SELECT * FROM claims) TO STDOUT CSV HEADER" > claims.csv
```

### Importing Addresses from CSV

**Via Admin Dashboard:**
1. Go to http://localhost:3000/admin/addresses/import
2. Select campaign
3. Upload CSV file
4. Map columns
5. Submit

## Troubleshooting

### "Tenant or user not found" Error

This occurs when:
- Wrong database password
- Wrong project reference ID
- Using pooler URL with transaction mode incorrectly
- Network/firewall blocking connection

**Solution:**
1. Verify credentials in Supabase dashboard
2. Use `supabase db push` with CLI (recommended)
3. Or paste SQL directly in Supabase SQL Editor

### "Table does not exist" from Supabase API

The tables exist in PostgreSQL but PostgREST can't see them.

**Solution:**
```sql
NOTIFY pgrst, 'reload schema';
```

Or run:
```bash
node scripts/reload-schema.js
```

### "uuid_generate_v4() does not exist"

**Solution:**
Update migration to use `gen_random_uuid()` from pgcrypto:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

### CLI Authentication Fails

**Solution:**
1. Get a fresh access token: https://supabase.com/dashboard/account/tokens
2. Login again:
   ```bash
   supabase login --token sbp_your_new_token
   ```

## Manual Fallback

If the CLI doesn't work, you can always:

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/[project-ref]/sql/new
2. Copy contents from `supabase/migrations/001_initial_schema.sql`
3. Paste and run
4. Copy contents from `supabase/migrations/002_seed_data.sql`
5. Paste and run

## Security Considerations

1. **Never expose `SUPABASE_KEY` to the browser**
   - It's a `service_role` key with full database access
   - Only use in server-side code (API routes, server components)

2. **Row Level Security (RLS) is disabled**
   - We're not using Supabase Auth
   - All access control is in application code
   - Tables have RLS explicitly disabled

3. **Admin Access**
   - Controlled via `ADMIN_EMAIL_ALLOWLIST`
   - OTP authentication via Mailgun
   - Sessions expire after `ADMIN_SESSION_TTL_DAYS`

4. **Rate Limiting**
   - 3 OTP requests per email per hour
   - 10 OTP requests per IP per hour
   - 5 claims per IP per day
   - Max attempts tracked on OTP verification

## Running the Application

### Quick Start

After database setup, start the application with health checks:

```bash
npm run dev:start
# or
./scripts/start.sh
```

This will:
1. Verify `.env.local` exists
2. Check database connection
3. Verify campaigns exist
4. Check port availability
5. Display test URLs
6. Start the dev server

### Stop the Application

Gracefully stop the dev server:

```bash
npm run dev:stop
# or
./scripts/stop.sh
```

### Manual Start (No Health Checks)

If you prefer to skip health checks:

```bash
npm run dev
```

### NPM Scripts Reference

```bash
# Application
npm run dev              # Start Next.js dev server (basic)
npm run dev:start        # Start with health checks (recommended)
npm run dev:stop         # Stop dev server gracefully
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:check         # Check database status
npm run db:reload        # Reload schema cache
npm run db:seed          # Push migrations with seed data
npm run db:setup         # Full database setup (migrate + reload)
```

### Script Documentation

For detailed information about all available scripts, see [scripts/README.md](../scripts/README.md).

## References

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli/introduction)
- [Supabase CLI Getting Started](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [PostgREST Schema Cache](https://docs.postgrest.org/en/latest/references/schema_cache.html)
- [Supabase Schema Reload](https://supabase.com/docs/guides/troubleshooting/refresh-postgrest-schema)
- [Postgres Extensions](https://supabase.com/docs/guides/database/extensions)

## Quick Reference Commands

```bash
# Login to Supabase CLI
supabase login --token sbp_your_token

# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Create new migration
supabase migration new migration_name

# Check database status
node scripts/check-db.js

# Reload schema cache
node scripts/reload-schema.js

# Update Supabase CLI
brew upgrade supabase
```
