#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase PostgreSQL connection
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
const connectionString = `postgresql://postgres.cqsmyqblrguejufewimo:${process.env.SUPABASE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function createTables() {
  console.log('🔌 Connecting to Supabase PostgreSQL...\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📋 Creating tables...');
    await client.query(sql);
    console.log('✅ Tables created!\n');

    // Read seed data
    const seedPath = path.join(__dirname, '../supabase/migrations/002_seed_data.sql');
    const seed = fs.readFileSync(seedPath, 'utf-8');

    console.log('🌱 Adding test campaigns...');
    await client.query(seed);
    console.log('✅ Test campaigns added!\n');

    // Verify
    const { rows } = await client.query('SELECT slug, title FROM campaigns');
    console.log('📊 Campaigns in database:');
    rows.forEach(row => {
      console.log(`   • ${row.title} (/c/${row.slug})`);
    });

    console.log('\n✨ All done! Database is ready.');

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('password')) {
      console.log('\n💡 The connection needs your database password.');
      console.log('   Get it from: https://supabase.com/dashboard/project/cqsmyqblrguejufewimo/settings/database');
      console.log('   Look for "Database password" or "Connection pooling"');
    }
  } finally {
    await client.end();
  }
}

createTables();
