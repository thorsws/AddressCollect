#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response.json();
}

async function runMigrations() {
  console.log('🚀 Creating database tables...\n');

  // Read schema file
  const schemaPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  console.log('📋 Executing schema migration...');
  console.log('This will create:');
  console.log('  - admin_otp_requests');
  console.log('  - admin_sessions');
  console.log('  - campaigns');
  console.log('  - claims');
  console.log('  - invite_codes');
  console.log('  - email_verifications\n');

  try {
    // Split and execute statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      process.stdout.write(`Executing statement ${i + 1}/${statements.length}...`);

      try {
        await executeSql(statement);
        process.stdout.write(' ✅\n');
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists')) {
          process.stdout.write(' ⏭️  (already exists)\n');
        } else {
          process.stdout.write(' ❌\n');
          console.error(`Error: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Schema migration complete!');

    // Run seed data
    const seedPath = path.join(__dirname, '../supabase/migrations/002_seed_data.sql');
    const seed = fs.readFileSync(seedPath, 'utf-8');

    console.log('\n🌱 Inserting seed data (test campaigns)...');

    const seedStatements = seed
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < seedStatements.length; i++) {
      const statement = seedStatements[i];
      if (!statement) continue;

      process.stdout.write(`Inserting seed ${i + 1}/${seedStatements.length}...`);

      try {
        await executeSql(statement);
        process.stdout.write(' ✅\n');
      } catch (error) {
        process.stdout.write(' ⏭️  (skipped)\n');
      }
    }

    console.log('\n✨ All done! Your database is ready.');
    console.log('\nTest campaigns created:');
    console.log('  📍 http://localhost:3000/c/stanford');
    console.log('  📍 http://localhost:3000/c/partner-event');
    console.log('\nAdmin dashboard:');
    console.log('  🔐 http://localhost:3000/admin/login');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: Run the SQL manually in Supabase SQL Editor');
    console.log('   https://supabase.com/dashboard/project/cqsmyqblrguejufewimo/sql');
    process.exit(1);
  }
}

runMigrations();
