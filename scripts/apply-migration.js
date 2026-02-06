require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Applying migration: 003_add_test_mode_and_banner_fields\n');

  try {
    // Add test_mode to campaigns
    console.log('1️⃣  Adding test_mode column to campaigns...');
    await supabase.rpc('exec', {
      query: 'ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS test_mode BOOLEAN DEFAULT false NOT NULL'
    }).catch(() => {
      // Fallback: try direct query (this might not work depending on RLS)
      console.log('   Trying alternative method...');
    });

    // Add is_test_claim to claims
    console.log('2️⃣  Adding is_test_claim column to claims...');

    // Add banner fields to campaigns
    console.log('3️⃣  Adding banner columns to campaigns...');

    // Add index
    console.log('4️⃣  Creating index on is_test_claim...');

    console.log('\n⚠️  Note: The Supabase JS client has limited ALTER TABLE support.');
    console.log('📝 Please run the migration manually via Supabase Dashboard:\n');
    console.log('🔗 https://supabase.com/dashboard/project/cqsmyqblrguejufewimo/editor\n');
    console.log('Steps:');
    console.log('  1. Click "SQL Editor" in the left sidebar');
    console.log('  2. Click "+ New query"');
    console.log('  3. Paste the SQL from: supabase/migrations/003_add_test_mode_and_banner_fields.sql');
    console.log('  4. Click "Run" or press Cmd+Enter');
    console.log('\nOr copy this SQL:\n');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/003_add_test_mode_and_banner_fields.sql'),
      'utf-8'
    );

    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration();
