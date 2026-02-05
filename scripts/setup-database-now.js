#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_PASSWORD = '4wMIwYE5QrO1joas';

async function setupDatabase() {
  console.log('🚀 Connecting to Supabase PostgreSQL...\n');

  // Try direct connection
  const client = new Client({
    host: 'db.cqsmyqblrguejufewimo.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database!\n');

    // Read and execute schema
    console.log('📋 Creating tables...');
    const schemaPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await client.query(schema);
    console.log('✅ All tables created successfully!\n');

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

    console.log('\n🎉 Database setup complete!');
    console.log('\nYou can now run: npm run dev');
    console.log('\nTest URLs:');
    console.log('   📍 http://localhost:3000/c/stanford');
    console.log('   📍 http://localhost:3000/c/partner-event');
    console.log('   🔐 http://localhost:3000/admin/login');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await client.end();
  }
}

setupDatabase();
