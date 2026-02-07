# How to Run Database Migrations

Quick guide for running migrations using the Supabase CLI with access tokens.

## Prerequisites

- Supabase CLI installed (`brew install supabase/tap/supabase`)
- A fresh Supabase access token with proper permissions

## Getting a Valid Access Token

The key is getting an access token with the right permissions:

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Give it a name (e.g., "CLI Migrations")
4. **Important**: Make sure it's a fresh token with full project access
5. Copy the token (starts with `sbp_...`)

## Running Migrations - Step by Step

### 1. Login with Access Token

```bash
supabase login --token sbp_your_access_token_here
```

You should see: "You are now logged in. Happy coding!"

### 2. Link Your Project

```bash
supabase link --project-ref cqsmyqblrguejufewimo
```

**Critical**: If this fails with "Unauthorized", your token doesn't have the right permissions. Generate a new token and try again.

Success message: "Finished supabase link."

### 3. Push Migrations

```bash
supabase db push
```

This will:
- Show which migrations will be applied
- Ask for confirmation (press Y)
- Apply the migrations
- Show "Remote database is up to date" when done

## Common Issues

### "Unauthorized" Error on Link

**Problem**: Access token doesn't have project access

**Solution**:
1. Delete the old token
2. Generate a fresh token
3. Try again with the new token

### "Database Password Required"

**Problem**: Token lacks database access permissions

**Solution**: Generate a new token with full permissions (see step above)

## What Worked

The working solution uses:
- **Fresh access token** with full project permissions
- **supabase link** to establish project connection
- **supabase db push** to apply migrations

No database password needed if the token has proper permissions!

## Example Migration Flow

```bash
# 1. Login
supabase login --token sbp_5e04d4ceca746c09e9272e21b74e818c3d4f96ae

# 2. Link project
supabase link --project-ref cqsmyqblrguejufewimo

# 3. Push migrations (auto-confirms with Y)
echo "Y" | supabase db push
```

## Verifying Migration Success

Check if migration applied:

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY
);
(async () => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, show_logo')
    .limit(1);
  console.log(error ? 'Column missing' : '✅ Migration applied!');
})();
"
```

## Key Learnings

1. **Token permissions matter** - Not all access tokens are equal
2. **Fresh tokens work better** - Old tokens may have expired permissions
3. **Link before push** - Always run `supabase link` first
4. **No database password needed** - If your token has the right permissions

---

**Last Updated**: February 2026
**Successful Migration**: 010_add_show_logo_to_campaigns.sql
