#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

async function checkDatabase() {
  console.log('🔍 Checking database status...\n');

  const tables = [
    'admin_otp_requests',
    'admin_sessions',
    'campaigns',
    'claims',
    'invite_codes',
    'email_verifications'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log(`❌ ${table} - NOT CREATED`);
        } else {
          console.log(`❓ ${table} - Error: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table} - EXISTS (${count || 0} rows)`);
      }
    } catch (e) {
      console.log(`❌ ${table} - ERROR: ${e.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log('If any tables show ❌, you need to run the SQL in Supabase Editor');
}

checkDatabase();
