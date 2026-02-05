#!/bin/bash

# Setup Heroku Pipeline with Staging and Production
# This script creates a pipeline with staging and production apps

set -e

echo "🚀 Setting up Heroku Pipeline for Address Collection System"
echo ""

# Configuration
PIPELINE_NAME="address-collect"
ORG_NAME="cognitivekin"
STAGING_APP_NAME="address-collect-staging"
PROD_APP_NAME="address-collect-prod"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Configuration:${NC}"
echo "  Pipeline: $PIPELINE_NAME"
echo "  Organization: $ORG_NAME"
echo "  Staging: $STAGING_APP_NAME"
echo "  Production: $PROD_APP_NAME"
echo ""

# Check if logged in to Heroku
echo "Checking Heroku authentication..."
if ! heroku auth:whoami &> /dev/null; then
  echo -e "${YELLOW}⚠️  Not logged in to Heroku. Please run: heroku login${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Logged in to Heroku${NC}"
echo ""

# Create staging app first
echo "🔨 Creating staging app: $STAGING_APP_NAME"
if heroku apps:info --app $STAGING_APP_NAME &> /dev/null; then
  echo -e "${YELLOW}⚠️  Staging app already exists${NC}"
else
  heroku apps:create $STAGING_APP_NAME --team $ORG_NAME
  echo -e "${GREEN}✅ Staging app created${NC}"
fi
echo ""

# Create production app
echo "🏭 Creating production app: $PROD_APP_NAME"
if heroku apps:info --app $PROD_APP_NAME &> /dev/null; then
  echo -e "${YELLOW}⚠️  Production app already exists${NC}"
else
  heroku apps:create $PROD_APP_NAME --team $ORG_NAME
  echo -e "${GREEN}✅ Production app created${NC}"
fi
echo ""

# Create pipeline with staging app
echo "📦 Creating pipeline: $PIPELINE_NAME"
if heroku pipelines:info $PIPELINE_NAME &> /dev/null; then
  echo -e "${YELLOW}⚠️  Pipeline already exists${NC}"
else
  heroku pipelines:create $PIPELINE_NAME --app $STAGING_APP_NAME --stage staging --team $ORG_NAME
  echo -e "${GREEN}✅ Pipeline created with staging app${NC}"
fi
echo ""

# Add production app to pipeline
echo "Adding production app to pipeline..."
heroku pipelines:add $PIPELINE_NAME --app $PROD_APP_NAME --stage production
echo -e "${GREEN}✅ Production app added to pipeline${NC}"
echo ""

# Add git remotes
echo "🔗 Setting up git remotes..."
if git remote get-url heroku-staging &> /dev/null; then
  git remote remove heroku-staging
fi
git remote add heroku-staging https://git.heroku.com/$STAGING_APP_NAME.git
echo -e "${GREEN}✅ Added remote: heroku-staging${NC}"

if git remote get-url heroku-production &> /dev/null; then
  git remote remove heroku-production
fi
git remote add heroku-production https://git.heroku.com/$PROD_APP_NAME.git
echo -e "${GREEN}✅ Added remote: heroku-production${NC}"
echo ""

# Set buildpacks
echo "📦 Setting Node.js buildpack..."
heroku buildpacks:set heroku/nodejs --app $STAGING_APP_NAME
heroku buildpacks:set heroku/nodejs --app $PROD_APP_NAME
echo -e "${GREEN}✅ Buildpacks configured${NC}"
echo ""

# Display next steps
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🎉 Pipeline Setup Complete!                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Set environment variables for STAGING:"
echo "   heroku config:set NEXT_PUBLIC_SUPABASE_URL=your-url --app $STAGING_APP_NAME"
echo "   heroku config:set SUPABASE_KEY=your-key --app $STAGING_APP_NAME"
echo "   heroku config:set ADMIN_EMAIL_ALLOWLIST=your-email --app $STAGING_APP_NAME"
echo "   heroku config:set MAILGUN_API_KEY=your-key --app $STAGING_APP_NAME"
echo "   heroku config:set MAILGUN_DOMAIN=your-domain --app $STAGING_APP_NAME"
echo "   heroku config:set MAILGUN_FROM=your-email --app $STAGING_APP_NAME"
echo "   heroku config:set APP_BASE_URL=https://$STAGING_APP_NAME.herokuapp.com --app $STAGING_APP_NAME"
echo ""
echo "   Or use the helper script:"
echo "   ./scripts/set-heroku-env.sh staging"
echo ""
echo "2. Set environment variables for PRODUCTION:"
echo "   (Same as staging, but use --app $PROD_APP_NAME)"
echo "   Or use: ./scripts/set-heroku-env.sh production"
echo ""
echo "3. Deploy to staging:"
echo "   git push heroku-staging main"
echo ""
echo "4. Test staging deployment:"
echo "   https://$STAGING_APP_NAME.herokuapp.com"
echo ""
echo "5. Promote to production:"
echo "   heroku pipelines:promote --app $STAGING_APP_NAME"
echo ""
echo "6. View pipeline:"
echo "   heroku pipelines:info $PIPELINE_NAME"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
