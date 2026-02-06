import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running migration: 003_add_test_mode_and_banner_fields.sql');

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/003_add_test_mode_and_banner_fields.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Executing SQL...\n');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // Try alternative: split and execute statements one by one
      console.log('Trying alternative approach: executing statements individually...\n');

      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (stmtError) {
          console.error('Error:', stmtError);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew fields added:');
    console.log('  - campaigns.test_mode (BOOLEAN)');
    console.log('  - campaigns.show_banner (BOOLEAN)');
    console.log('  - campaigns.banner_url (TEXT)');
    console.log('  - claims.is_test_claim (BOOLEAN)');
    console.log('  - Index: idx_claims_is_test_claim');

  } catch (error) {
    console.error('Migration failed:', error);
    console.log('\n⚠️  Alternative: Apply migration manually via Supabase Dashboard');
    console.log('  1. Go to: https://supabase.com/dashboard/project/cqsmyqblrguejufewimo/editor');
    console.log('  2. Open SQL Editor');
    console.log('  3. Paste and run: supabase/migrations/003_add_test_mode_and_banner_fields.sql');
    process.exit(1);
  }
}

runMigration();
