import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');

  // Read migration files
  const schema = readFileSync(
    join(__dirname, '../supabase/migrations/001_initial_schema.sql'),
    'utf-8'
  );

  const seed = readFileSync(
    join(__dirname, '../supabase/migrations/002_seed_data.sql'),
    'utf-8'
  );

  // Run schema migration
  console.log('📋 Creating tables...');
  const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schema });

  if (schemaError) {
    console.error('❌ Schema migration failed:', schemaError);

    // Try direct SQL execution
    console.log('Trying alternative method...');
    const statements = schema.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (!statement.trim()) continue;

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) console.error('Error:', error.message);
      } catch (e: any) {
        console.error('Error:', e.message);
      }
    }
  } else {
    console.log('✅ Tables created successfully!');
  }

  // Run seed data
  console.log('\n🌱 Inserting seed data...');
  const { error: seedError } = await supabase.rpc('exec_sql', { sql: seed });

  if (seedError) {
    console.error('❌ Seed data failed:', seedError);
  } else {
    console.log('✅ Seed data inserted successfully!');
  }

  console.log('\n✨ Migrations complete!');
}

runMigrations().catch(console.error);
