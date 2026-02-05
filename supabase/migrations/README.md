# Database Migrations

## How to Apply Migrations

### Option 1: Using Supabase Dashboard SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `001_initial_schema.sql`
4. Click "Run" to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

### Option 3: Manual Execution

You can also run the SQL directly against your database using any PostgreSQL client with the connection string from your Supabase project settings.

## Migration Files

- `001_initial_schema.sql` - Creates all required tables:
  - `admin_otp_requests` - OTP authentication data
  - `admin_sessions` - Admin session management
  - `campaigns` - Campaign configurations
  - `claims` - Address submissions from users
  - `invite_codes` - Optional invite code system
  - `email_verifications` - Optional email verification tokens

## Seed Data

After running migrations, you may want to create a test campaign. See `002_seed_data.sql` for example seed data.
