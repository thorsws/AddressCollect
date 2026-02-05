# Scripts

This directory contains utility scripts for managing the Address Collection Campaign System.

## Application Management

### start.sh

Starts the Next.js development server with health checks.

**Usage:**
```bash
./scripts/start.sh
# or
npm run dev:start
```

**What it does:**
1. Checks if `.env.local` exists
2. Installs dependencies if `node_modules` is missing
3. Verifies database connection
4. Checks if campaigns exist (offers to load seed data if empty)
5. Checks if port 3000 is available
6. Displays available URLs and test campaigns
7. Starts the Next.js dev server

**Features:**
- Colored console output for better readability
- Interactive prompts for loading seed data
- Port conflict detection and resolution
- Automatic campaign listing

### stop.sh

Gracefully stops the Next.js development server.

**Usage:**
```bash
./scripts/stop.sh
# or
npm run dev:stop
```

**What it does:**
1. Checks for PID file from start script
2. Attempts graceful shutdown (SIGTERM)
3. Waits up to 5 seconds for process to stop
4. Force kills (SIGKILL) if necessary
5. Cleans up any processes on port 3000
6. Stops any remaining Next.js dev processes

**Features:**
- Graceful shutdown with fallback to force kill
- Comprehensive process cleanup
- Port-based process detection
- Process name-based cleanup

## Database Management

### check-db.js

Checks the status of all database tables.

**Usage:**
```bash
node scripts/check-db.js
# or
npm run db:check
```

**Output:**
```
✅ admin_otp_requests - EXISTS (0 rows)
✅ campaigns - EXISTS (2 rows)
✅ claims - EXISTS (5 rows)
...
```

### reload-schema.js

Reloads the PostgREST schema cache and verifies database connectivity.

**Usage:**
```bash
node scripts/reload-schema.js
# or
npm run db:reload
```

**When to use:**
- After creating tables manually in SQL Editor
- When Supabase API can't see newly created tables
- After schema changes

### add-test-campaigns.js

Adds test campaigns to the database using the Supabase client.

**Usage:**
```bash
node scripts/add-test-campaigns.js
```

**What it creates:**
- Stanford Book Giveaway campaign
- Partner Event Book Voucher campaign
- Invite codes (PARTNER2026, VIP2026)

**Note:** This script uses the Supabase client API. If tables aren't in the schema cache, use `supabase db push` instead.

## Legacy/Alternative Scripts

These scripts were created during development and provide alternative methods for database setup. They're kept for reference but the recommended approach is using Supabase CLI.

### setup-database.js

Attempts to set up the database using PostgreSQL pooler connection.

**Note:** May fail with "Tenant or user not found" error. Use `supabase db push` instead.

### setup-database-now.js

Attempts direct PostgreSQL connection to create tables.

**Note:** May fail with network errors. Use `supabase db push` instead.

### create-tables-pg.js

Alternative PostgreSQL connection approach.

**Note:** Use `supabase db push` instead.

### execute-migrations.js

Attempts to execute migrations via Supabase REST API.

**Note:** Supabase doesn't support raw SQL via REST API. Use `supabase db push` instead.

## NPM Scripts Quick Reference

All these scripts can be run via npm:

```bash
# Application
npm run dev              # Start Next.js dev server (basic)
npm run dev:start        # Start with health checks (recommended)
npm run dev:stop         # Stop dev server gracefully
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:check         # Check database status
npm run db:reload        # Reload schema cache
npm run db:seed          # Push migrations with seed data
npm run db:setup         # Full database setup (migrate + reload)
```

## Recommended Workflow

### First Time Setup

```bash
# 1. Install Supabase CLI
brew install supabase/tap/supabase

# 2. Login to Supabase
supabase login --token sbp_your_access_token

# 3. Link your project
supabase link --project-ref your-project-ref

# 4. Setup database
npm run db:setup

# 5. Start the application
npm run dev:start
```

### Daily Development

```bash
# Start with health checks
npm run dev:start

# ... do your work ...

# Stop gracefully
npm run dev:stop
```

### After Schema Changes

```bash
# Push new migrations
supabase db push

# Reload schema cache
npm run db:reload
```

### Database Troubleshooting

```bash
# Check all tables
npm run db:check

# Reload schema if API can't see tables
npm run db:reload

# Full reset (re-run migrations)
npm run db:setup
```

## Environment Variables Required

All scripts expect these environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_KEY=[service-role-key]
```

For email functionality:
```bash
MAILGUN_API_KEY=[your-key]
MAILGUN_DOMAIN=[your-domain]
MAILGUN_FROM_EMAIL=[your-email]
```

For admin access:
```bash
ADMIN_EMAIL_ALLOWLIST=email1@example.com,email2@example.com
ADMIN_SESSION_TTL_DAYS=7
```

## Troubleshooting

### "Permission denied" when running scripts

```bash
chmod +x scripts/start.sh scripts/stop.sh
```

### "Port 3000 already in use"

The start script will detect this and offer to kill the existing process. Or run:
```bash
npm run dev:stop
```

### "Database connection failed"

Check your `.env.local` credentials:
```bash
npm run db:check
```

### "Table does not exist" from API

Reload the schema cache:
```bash
npm run db:reload
```

### Scripts fail with "command not found"

Make sure you're in the project root directory and have run `npm install`.

## File Permissions

All `.sh` scripts should be executable:
```bash
chmod +x scripts/*.sh
```

## Security Notes

- Never commit `.env.local`
- Never expose `SUPABASE_KEY` to the browser
- Database credentials in scripts are for development only
- Use environment variables for production deployments
