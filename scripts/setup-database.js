#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...\n');

  // Connection string using pooler (port 6543)
  const connectionString = 'postgresql://postgres.cqsmyqblrguejufewimo:4wMIwYE5QrO1joas@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database!\n');

    // Drop existing tables to start fresh
    console.log('🗑️  Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS email_verifications CASCADE;
      DROP TABLE IF EXISTS claims CASCADE;
      DROP TABLE IF EXISTS invite_codes CASCADE;
      DROP TABLE IF EXISTS campaigns CASCADE;
      DROP TABLE IF EXISTS admin_sessions CASCADE;
      DROP TABLE IF EXISTS admin_otp_requests CASCADE;
    `);
    console.log('✅ Existing tables dropped\n');

    // Read and execute schema
    console.log('📋 Creating tables...');
    const schemaPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await client.query(schema);
    console.log('✅ Tables created successfully!\n');

    // Disable RLS on all tables (since we're not using Supabase Auth)
    console.log('🔓 Disabling Row Level Security...');
    await client.query(`
      ALTER TABLE admin_otp_requests DISABLE ROW LEVEL SECURITY;
      ALTER TABLE admin_sessions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
      ALTER TABLE claims DISABLE ROW LEVEL SECURITY;
      ALTER TABLE invite_codes DISABLE ROW LEVEL SECURITY;
      ALTER TABLE email_verifications DISABLE ROW LEVEL SECURITY;
    `);
    console.log('✅ RLS disabled on all tables\n');

    // Read and execute seed data
    console.log('🌱 Adding test campaigns...');
    const seedPath = path.join(__dirname, '../supabase/migrations/002_seed_data.sql');
    const seed = fs.readFileSync(seedPath, 'utf-8');

    await client.query(seed);
    console.log('✅ Test campaigns added!\n');

    // Verify what was created
    console.log('📊 Verifying database...');
    const { rows: tables } = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('\n✅ Tables created:');
    tables.forEach(t => console.log(`   • ${t.tablename}`));

    const { rows: campaigns } = await client.query('SELECT slug, title FROM campaigns');
    console.log('\n✅ Campaigns created:');
    campaigns.forEach(c => console.log(`   • ${c.title} (/c/${c.slug})`));

    const { rows: codes } = await client.query('SELECT code, max_uses FROM invite_codes');
    console.log('\n✅ Invite codes created:');
    codes.forEach(c => console.log(`   • ${c.code} (${c.max_uses} uses)`));

    console.log('\n🎉 Database setup complete!');
    console.log('\nYou can now run: npm run dev');
    console.log('\nTest URLs:');
    console.log('   📍 http://localhost:3000/c/stanford');
    console.log('   📍 http://localhost:3000/c/partner-event');
    console.log('   🔐 http://localhost:3000/admin/login');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
