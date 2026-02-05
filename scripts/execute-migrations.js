#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function executeSQL(sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;

    try {
      // Use Supabase client to execute via RPC if available, otherwise direct query
      const { error } = await supabase.rpc('exec', { sql: statement });

      if (error) {
        // Try alternative: create a temporary function
        const { error: altError } = await supabase.from('_migrations').insert({ sql: statement });
        if (altError && !altError.message.includes('does not exist')) {
          throw error;
        }
      }
    } catch (e) {
      // Most statements will fail via this method, which is expected
      continue;
    }
  }
}

async function createTables() {
  console.log('🚀 Creating database tables...\n');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('Creating tables via Supabase...');

    // Try to create each table individually
    const tables = [
      {
        name: 'admin_otp_requests',
        sql: `
CREATE TABLE IF NOT EXISTS admin_otp_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_hash TEXT
)`
      },
      {
        name: 'admin_sessions',
        sql: `
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  session_token_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip_hash TEXT,
  user_agent TEXT
)`
      },
      {
        name: 'campaigns',
        sql: `
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  capacity_total INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  require_email BOOLEAN DEFAULT false,
  require_email_verification BOOLEAN DEFAULT false,
  require_invite_code BOOLEAN DEFAULT false,
  show_scarcity BOOLEAN DEFAULT false,
  collect_company BOOLEAN DEFAULT false,
  collect_phone BOOLEAN DEFAULT false,
  collect_title BOOLEAN DEFAULT false,
  privacy_blurb TEXT,
  max_claims_per_email INT DEFAULT 1,
  max_claims_per_ip_per_day INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)`
      }
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table.name).select('id').limit(1);
        if (!error || error.message.includes('does not exist')) {
          console.log(`✅ ${table.name} - needs creation`);
        } else {
          console.log(`⏭️  ${table.name} - already exists`);
        }
      } catch (e) {
        console.log(`❓ ${table.name} - checking...`);
      }
    }

    console.log('\n❌ Unable to create tables programmatically');
    console.log('\n📋 Please use the Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/cqsmyqblrguejufewimo/sql/new');
    console.log('\n💡 Copy the SQL from:');
    console.log(`   ${schemaPath}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTables();
