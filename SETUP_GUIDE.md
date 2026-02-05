# Quick Setup Guide

## Step 1: Get Supabase API Keys

You need **two keys** from your Supabase project:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `cqsmyqblrguejufewimo`
3. **Navigate to**: Project Settings → API

You'll see two important keys:

### Anon (public) Key
- **Label**: "Project API keys" → "anon" → "public"
- **Starts with**: `eyJ...`
- **Use for**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- This is safe to expose to the browser

### Service Role Key
- **Label**: "Project API keys" → "service_role" → "secret"
- **Starts with**: `eyJ...`
- **Use for**: `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ **NEVER expose this to the client** - server-side only!

## Step 2: Update .env.local

Open `.env.local` and update these values:

```env
# Already set ✓
NEXT_PUBLIC_SUPABASE_URL=https://cqsmyqblrguejufewimo.supabase.co

# Copy your ANON key here
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_anon_key_here

# Copy your SERVICE ROLE key here
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key_here

# Add your email address(es) - comma-separated
ADMIN_EMAIL_ALLOWLIST=your-email@example.com,another@example.com
```

## Step 3: Get Mailgun Credentials

If you don't have Mailgun set up yet:

1. **Sign up**: https://www.mailgun.com/
2. **Verify a domain** (or use sandbox for testing)
3. **Get API Key**: Settings → API Keys
4. **Update .env.local**:
   ```env
   MAILGUN_API_KEY=your_mailgun_api_key
   MAILGUN_DOMAIN=your_domain.com  # or sandbox domain
   MAILGUN_FROM_EMAIL=noreply@your_domain.com
   ```

### Testing with Mailgun Sandbox (Optional)
For development/testing, you can use Mailgun's sandbox domain:
- Domain will look like: `sandboxXXXXXXX.mailgun.org`
- You'll need to add authorized recipients in Mailgun dashboard
- **Free tier limitation**: Can only send to authorized recipients

## Step 4: Run Database Migrations

1. **Open Supabase SQL Editor**:
   - Go to https://supabase.com/dashboard/project/cqsmyqblrguejufewimo
   - Click "SQL Editor" in the left sidebar

2. **Run the schema migration**:
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click "Run"

3. **Run the seed data** (optional - creates test campaigns):
   - Open `supabase/migrations/002_seed_data.sql`
   - Copy and paste into SQL Editor
   - Click "Run"

This creates all tables:
- ✓ admin_otp_requests
- ✓ admin_sessions
- ✓ campaigns
- ✓ claims
- ✓ invite_codes
- ✓ email_verifications

## Step 5: Start the Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Step 6: Test Admin Login

1. Visit http://localhost:3000/admin/login
2. Enter your email (from ADMIN_EMAIL_ALLOWLIST)
3. Check your email for the 6-digit OTP code
4. Enter the code
5. You should be redirected to the admin dashboard!

## Step 7: Test a Campaign (If you ran seed data)

Visit http://localhost:3000/c/stanford to see the public campaign page.

## Troubleshooting

### "Campaign not found" error
- Make sure you ran the seed data migration (002_seed_data.sql)
- Or create a campaign manually in Supabase

### OTP email not received
- Check Mailgun dashboard logs
- Verify MAILGUN_API_KEY is correct
- Check spam folder
- If using sandbox, make sure your email is authorized

### Admin login fails
- Verify email is in ADMIN_EMAIL_ALLOWLIST
- Check for typos or extra spaces
- Ensure ADMIN_EMAIL_ALLOWLIST uses comma separation with no spaces

### Database connection errors
- Verify both Supabase keys are correct
- Make sure you copied the full keys (they're long!)
- Check that URL matches your project

## Quick Checklist

- [ ] Got Supabase anon key from API settings
- [ ] Got Supabase service role key from API settings
- [ ] Updated .env.local with both keys
- [ ] Added your email to ADMIN_EMAIL_ALLOWLIST
- [ ] Set up Mailgun account and got API key
- [ ] Updated Mailgun settings in .env.local
- [ ] Ran database migration 001_initial_schema.sql
- [ ] Ran seed data 002_seed_data.sql (optional)
- [ ] Started dev server with `npm run dev`
- [ ] Tested admin login at /admin/login
- [ ] Received OTP email successfully

## Next Steps

Once everything works:
- Create your own campaigns (edit via Supabase directly for now)
- Test the full flow: public page → submit claim → admin view
- Try CSV export and import features
- Customize email templates in `lib/mailgun/index.ts`
- Deploy to Vercel when ready

## Need Help?

Check these files:
- [README.md](README.md) - Full documentation
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Feature overview
- [docs/rules.md](docs/rules.md) - Original requirements
