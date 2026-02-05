#!/bin/bash

# Set Heroku Environment Variables
# Usage: ./scripts/set-heroku-env.sh [staging|production]

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: ./scripts/set-heroku-env.sh [staging|production]"
  exit 1
fi

# Configuration
if [ "$ENVIRONMENT" = "staging" ]; then
  APP_NAME="address-collect-staging"
elif [ "$ENVIRONMENT" = "production" ]; then
  APP_NAME="address-collect-prod"
else
  echo "Invalid environment. Use 'staging' or 'production'"
  exit 1
fi

echo "🔧 Setting environment variables for $ENVIRONMENT ($APP_NAME)"
echo ""

# Load .env.local
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found"
  exit 1
fi

# Parse .env.local (ignore comments and empty lines)
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ $key =~ ^#.* ]] && continue
  [[ -z $key ]] && continue

  # Remove quotes from value if present
  value="${value%\"}"
  value="${value#\"}"

  # Export variable
  export "$key=$value"
done < <(grep -v '^#' .env.local | grep -v '^$')

# Set Heroku config vars
echo "Setting NEXT_PUBLIC_SUPABASE_URL..."
heroku config:set NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" --app $APP_NAME

echo "Setting SUPABASE_KEY..."
heroku config:set SUPABASE_KEY="$SUPABASE_KEY" --app $APP_NAME

echo "Setting ADMIN_EMAIL_ALLOWLIST..."
heroku config:set ADMIN_EMAIL_ALLOWLIST="$ADMIN_EMAIL_ALLOWLIST" --app $APP_NAME

echo "Setting MAILGUN_API_KEY..."
heroku config:set MAILGUN_API_KEY="$MAILGUN_API_KEY" --app $APP_NAME

echo "Setting MAILGUN_DOMAIN..."
heroku config:set MAILGUN_DOMAIN="$MAILGUN_DOMAIN" --app $APP_NAME

echo "Setting MAILGUN_FROM..."
heroku config:set MAILGUN_FROM="$MAILGUN_FROM" --app $APP_NAME

echo "Setting APP_BASE_URL..."
if [ "$ENVIRONMENT" = "staging" ]; then
  heroku config:set APP_BASE_URL="https://address-collect-staging.herokuapp.com" --app $APP_NAME
else
  heroku config:set APP_BASE_URL="https://address-collect-prod.herokuapp.com" --app $APP_NAME
fi

echo "Setting ADMIN_SESSION_TTL_DAYS..."
heroku config:set ADMIN_SESSION_TTL_DAYS="${ADMIN_SESSION_TTL_DAYS:-7}" --app $APP_NAME

echo "Setting NODE_ENV..."
heroku config:set NODE_ENV="production" --app $APP_NAME

echo ""
echo "✅ Environment variables set for $ENVIRONMENT"
echo ""
echo "View all config:"
echo "  heroku config --app $APP_NAME"
