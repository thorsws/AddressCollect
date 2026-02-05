#!/bin/bash

# Start script for Address Collection Campaign System
# This script checks the database connection and starts the Next.js dev server

set -e

echo "🚀 Starting Address Collection Campaign System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${RED}❌ Error: .env.local file not found${NC}"
  echo "Please create .env.local with your configuration."
  echo "See docs/database-setup.md for details."
  exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
  echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
  npm install
fi

# Check database connection
echo "🔍 Checking database connection..."
if node scripts/check-db.js > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Database connection successful${NC}"
else
  echo -e "${RED}❌ Database connection failed${NC}"
  echo "Please check your SUPABASE_URL and SUPABASE_KEY in .env.local"
  echo ""
  echo "Run 'node scripts/check-db.js' for more details"
  exit 1
fi

# Check if campaigns exist
echo "🔍 Checking for campaigns..."
CAMPAIGN_CHECK=$(node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);
supabase.from('campaigns').select('id', { count: 'exact', head: true })
  .then(({ count }) => console.log(count || 0))
  .catch(() => console.log('0'));
" 2>/dev/null)

if [ "$CAMPAIGN_CHECK" = "0" ]; then
  echo -e "${YELLOW}⚠️  No campaigns found in database${NC}"
  echo "The database is empty. Would you like to load seed data? (y/n)"
  read -r response
  if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Loading seed data..."
    supabase db push --include-seed
    echo -e "${GREEN}✅ Seed data loaded${NC}"
  fi
else
  echo -e "${GREEN}✅ Found $CAMPAIGN_CHECK campaign(s)${NC}"
fi

# Check if port 3000 is already in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
  echo "Would you like to kill the existing process? (y/n)"
  read -r response
  if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Stopping existing process on port 3000..."
    lsof -ti:3000 | xargs kill -9
    sleep 2
  else
    echo "Exiting. Please stop the existing process or use a different port."
    exit 1
  fi
fi

echo ""
echo -e "${GREEN}✨ Starting Next.js development server...${NC}"
echo ""
echo "Available URLs:"
echo "  🏠 Home: http://localhost:3000"
echo "  🔐 Admin: http://localhost:3000/admin/login"
echo ""
echo "Test campaigns:"
CAMPAIGNS=$(node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);
supabase.from('campaigns').select('slug, title')
  .then(({ data }) => {
    if (data && data.length > 0) {
      data.forEach(c => console.log(\`  📍 \${c.title}: http://localhost:3000/c/\${c.slug}\`));
    }
  })
  .catch(() => {});
" 2>/dev/null)

if [ -n "$CAMPAIGNS" ]; then
  echo "$CAMPAIGNS"
fi

echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Save PID to file for stop script
echo $$ > .dev-server.pid

# Start the dev server
npm run dev
