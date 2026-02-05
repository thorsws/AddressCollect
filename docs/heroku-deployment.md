# Heroku Deployment Guide

This guide explains how to deploy the Address Collection Campaign System to Heroku with a staging and production pipeline.

## Prerequisites

1. **Heroku CLI** installed
   ```bash
   brew tap heroku/brew && brew install heroku
   ```

2. **Heroku account** with access to the Cognitive Kin organization

3. **Logged in to Heroku**
   ```bash
   heroku login
   ```

## Pipeline Architecture

The deployment uses a Heroku pipeline with two environments:

- **Staging** (`address-collect-staging`) - For testing changes before production
- **Production** (`address-collect-prod`) - Live production environment

## Quick Setup

### 1. Create the Pipeline

Run the automated setup script:

```bash
./scripts/setup-heroku-pipeline.sh
```

This will:
- Create a pipeline named `address-collect`
- Create staging app: `address-collect-staging`
- Create production app: `address-collect-prod`
- Add both apps to the pipeline
- Configure git remotes
- Set Node.js buildpack

### 2. Set Environment Variables

**For Staging:**
```bash
./scripts/set-heroku-env.sh staging
```

**For Production:**
```bash
./scripts/set-heroku-env.sh production
```

These scripts automatically copy environment variables from your `.env.local` file to Heroku.

**Manual Alternative:**
```bash
# Staging
heroku config:set NEXT_PUBLIC_SUPABASE_URL=your-url --app address-collect-staging
heroku config:set SUPABASE_KEY=your-key --app address-collect-staging
heroku config:set ADMIN_EMAIL_ALLOWLIST=your-email --app address-collect-staging
heroku config:set MAILGUN_API_KEY=your-key --app address-collect-staging
heroku config:set MAILGUN_DOMAIN=your-domain --app address-collect-staging
heroku config:set MAILGUN_FROM=your-email --app address-collect-staging
heroku config:set APP_BASE_URL=https://address-collect-staging.herokuapp.com --app address-collect-staging

# Repeat for production with --app address-collect-prod
```

### 3. Deploy to Staging

```bash
git push heroku-staging main
```

This will:
- Build the Next.js application
- Run `npm run build`
- Start the production server with `npm run start`

### 4. Test Staging

Visit: https://address-collect-staging.herokuapp.com

Test:
- Campaign pages: `/c/stanford`
- Admin login: `/admin/login`
- Address submission flow
- Email verification (if enabled for campaign)

### 5. Promote to Production

Once staging is verified:

```bash
heroku pipelines:promote --app address-collect-staging
```

Or via Heroku Dashboard:
1. Go to the pipeline view
2. Click "Promote to production"

### 6. Verify Production

Visit: https://address-collect-prod.herokuapp.com

## Manual Deployment Commands

### Deploy to Staging
```bash
git push heroku-staging main
```

### Deploy Directly to Production
```bash
git push heroku-production main
```

### View Logs
```bash
# Staging
heroku logs --tail --app address-collect-staging

# Production
heroku logs --tail --app address-collect-prod
```

### Open in Browser
```bash
heroku open --app address-collect-staging
heroku open --app address-collect-prod
```

## Pipeline Management

### View Pipeline Info
```bash
heroku pipelines:info address-collect
```

### View Apps in Pipeline
```bash
heroku pipelines:info address-collect --json
```

### Enable Review Apps
Review apps automatically create temporary apps for pull requests.

```bash
heroku pipelines:update address-collect --enable-review-apps
```

Then configure in `app.json` (already included).

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase service role key | `eyJ...` or `sb_secret_...` |
| `ADMIN_EMAIL_ALLOWLIST` | Comma-separated admin emails | `admin@example.com,user@example.com` |
| `MAILGUN_API_KEY` | Mailgun API key | `key-xxx` |
| `MAILGUN_DOMAIN` | Mailgun domain | `mg.example.com` |
| `MAILGUN_FROM` | From email address | `noreply@example.com` |
| `APP_BASE_URL` | Application base URL | `https://your-app.herokuapp.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_SESSION_TTL_DAYS` | Session validity days | `7` |
| `NODE_ENV` | Node environment | `production` |

### View Current Config
```bash
heroku config --app address-collect-staging
heroku config --app address-collect-prod
```

### Update Single Variable
```bash
heroku config:set VARIABLE_NAME=value --app address-collect-staging
```

### Remove Variable
```bash
heroku config:unset VARIABLE_NAME --app address-collect-staging
```

## Database Considerations

The application uses Supabase PostgreSQL, which is **not** hosted on Heroku. The Heroku apps connect to your external Supabase database.

### Important Notes

1. **Same Database for Both Environments?**
   - **Recommended**: Use separate Supabase projects for staging and production
   - Prevents staging tests from affecting production data
   - Set different `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_KEY` for each environment

2. **Running Migrations**
   Migrations must be run via Supabase CLI, not on Heroku:
   ```bash
   # For staging database
   supabase link --project-ref staging-project-ref
   supabase db push

   # For production database
   supabase link --project-ref prod-project-ref
   supabase db push
   ```

3. **Seed Data**
   Load seed data to staging only:
   ```bash
   supabase db push --include-seed
   ```

## Scaling

### View Current Dynos
```bash
heroku ps --app address-collect-prod
```

### Scale Web Dynos
```bash
# Scale to 2 dynos
heroku ps:scale web=2 --app address-collect-prod

# Scale back to 1
heroku ps:scale web=1 --app address-collect-prod
```

### Upgrade Dyno Type
```bash
# Upgrade to Standard-1X
heroku ps:resize web=standard-1x --app address-collect-prod

# Upgrade to Performance-M
heroku ps:resize web=performance-m --app address-collect-prod
```

## Monitoring

### View Logs
```bash
# Real-time logs
heroku logs --tail --app address-collect-prod

# Last 200 lines
heroku logs -n 200 --app address-collect-prod

# Filter by source
heroku logs --source app --app address-collect-prod
```

### Add-ons for Monitoring

**Papertrail** (Log management):
```bash
heroku addons:create papertrail --app address-collect-prod
```

**New Relic** (Application monitoring):
```bash
heroku addons:create newrelic:wayne --app address-collect-prod
```

## Troubleshooting

### Build Fails

Check buildpack is set:
```bash
heroku buildpacks --app address-collect-staging
```

Should show: `heroku/nodejs`

### App Crashes

View logs:
```bash
heroku logs --tail --app address-collect-staging
```

Common issues:
- Missing environment variables
- Build errors (check `npm run build` locally)
- Database connection issues (verify Supabase credentials)

### Database Connection Errors

Verify environment variables:
```bash
heroku config:get NEXT_PUBLIC_SUPABASE_URL --app address-collect-staging
heroku config:get SUPABASE_KEY --app address-collect-staging
```

Test connection locally with same credentials:
```bash
npm run db:check
```

### Slow Performance

1. Check dyno type: `heroku ps --app address-collect-prod`
2. Enable caching in Next.js config
3. Consider upgrading to Standard or Performance dynos
4. Use CDN for static assets

## CI/CD with GitHub Actions

You can automate deployments using GitHub Actions.

Create `.github/workflows/deploy-staging.yml`:
```yaml
name: Deploy to Staging

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "address-collect-staging"
          heroku_email: "your-email@example.com"
```

## Custom Domain

### Add Domain to Production
```bash
heroku domains:add www.yourapp.com --app address-collect-prod
heroku domains:add yourapp.com --app address-collect-prod
```

### View DNS Targets
```bash
heroku domains --app address-collect-prod
```

### Enable Automated SSL
```bash
heroku certs:auto:enable --app address-collect-prod
```

## Rollback

### Rollback to Previous Release
```bash
heroku releases --app address-collect-prod
heroku rollback v123 --app address-collect-prod
```

## Maintenance Mode

### Enable Maintenance
```bash
heroku maintenance:on --app address-collect-prod
```

### Disable Maintenance
```bash
heroku maintenance:off --app address-collect-prod
```

## Cost Estimates

**Basic Setup (Recommended for Start):**
- 2 Basic dynos (staging + production): $14/month
- Total: **$14/month**

**Production Setup:**
- Staging: 1 Basic dyno: $7/month
- Production: 2 Standard-1X dynos: $50/month
- Add-ons (optional): $10-50/month
- Total: **~$67-107/month**

## Best Practices

1. **Always test on staging first**
2. **Use environment-specific Supabase projects**
3. **Keep staging and production configs in sync**
4. **Monitor logs regularly**
5. **Set up alerts for errors**
6. **Use review apps for pull request testing**
7. **Tag releases in Git**
8. **Document environment variable changes**

## References

- [Heroku Node.js Deployment](https://devcenter.heroku.com/articles/deploying-nodejs)
- [Heroku Pipelines](https://devcenter.heroku.com/articles/pipelines)
- [Next.js on Heroku](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

## Quick Reference

```bash
# Setup pipeline
./scripts/setup-heroku-pipeline.sh

# Set environment variables
./scripts/set-heroku-env.sh staging
./scripts/set-heroku-env.sh production

# Deploy to staging
git push heroku-staging main

# Promote to production
heroku pipelines:promote --app address-collect-staging

# View logs
heroku logs --tail --app address-collect-prod

# Open app
heroku open --app address-collect-prod

# View pipeline
heroku pipelines:info address-collect
```
