#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('🚀 Setting up database...\n');

  // Get connection string from Supabase
  // Format: postgres://[user]:[password]@[host]:5432/postgres
  const projectRef = 'cqsmyqblrguejufewimo';

  console.log('📝 To get your database password:');
  console.log(`   1. Go to: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
  console.log('   2. Copy the "Connection string" → "URI"');
  console.log('   3. Or use the SQL Editor directly\n');

  console.log('💡 For now, let\'s use the SQL Editor approach...\n');

  // Read migration files
  const schemaPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
  const seedPath = path.join(__dirname, '../supabase/migrations/002_seed_data.sql');

  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const seed = fs.readFileSync(seedPath, 'utf-8');

  console.log('✅ Migration files ready!');
  console.log('\n📋 STEP 1: Create Tables');
  console.log('─'.repeat(50));
  console.log('Go to: https://supabase.com/dashboard/project/cqsmyqblrguejufewimo/sql/new');
  console.log('\nCopy and paste this SQL:\n');
  console.log('─'.repeat(50));
  console.log(schema.substring(0, 200) + '...');
  console.log('─'.repeat(50));
  console.log(`\n(Full SQL is in: ${schemaPath})`);

  console.log('\n\n🌱 STEP 2: Add Test Data (Optional)');
  console.log('─'.repeat(50));
  console.log('After Step 1 succeeds, run this SQL:\n');
  console.log('─'.repeat(50));
  console.log(seed.substring(0, 200) + '...');
  console.log('─'.repeat(50));
  console.log(`\n(Full SQL is in: ${seedPath})`);

  console.log('\n\n✨ Or copy the full files from:');
  console.log(`   📄 ${schemaPath}`);
  console.log(`   📄 ${seedPath}`);
}

setupDatabase().catch(console.error);
