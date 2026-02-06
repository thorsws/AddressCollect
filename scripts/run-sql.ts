/**
 * Run a SQL migration file against Supabase
 * Usage: npx tsx scripts/run-sql.ts supabase/migrations/006_add_contact_email_fields.sql
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env.local manually
function loadEnv() {
  try {
    const paths = [
      resolve(process.cwd(), '.env.local'),
      '/Users/janrosen/NewApps/AddressCollect/.env.local'
    ];

    let envContent: string | null = null;

    for (const envPath of paths) {
      try {
        envContent = readFileSync(envPath, 'utf-8');
        break;
      } catch {
        // Try next path
      }
    }

    if (!envContent) {
      console.error('Could not find .env.local');
      return;
    }

    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  } catch (err) {
    console.error('Could not load .env.local:', err);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: npx tsx scripts/run-sql.ts <path-to-sql-file>');
  process.exit(1);
}

const sql = readFileSync(resolve(process.cwd(), sqlFile), 'utf-8');

console.log('Running SQL migration...\n');
console.log(sql);
console.log('\n---');

const supabase = createClient(supabaseUrl, supabaseKey);

// Split SQL into individual statements and execute
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function run() {
  for (const statement of statements) {
    if (statement.toLowerCase().startsWith('comment')) {
      console.log('Skipping COMMENT statement (not supported via client)');
      continue;
    }

    console.log(`Executing: ${statement.substring(0, 60)}...`);

    const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

    if (error) {
      // Try using the REST API directly
      console.log('RPC not available, this needs to be run in Supabase SQL Editor.');
      console.log('\n📋 Copy this SQL and run it in Supabase Dashboard:');
      console.log('🔗 https://supabase.com/dashboard/project/cqsmyqblrguejufewimo/editor\n');
      console.log(sql);
      return;
    }
  }

  console.log('\n✓ Migration complete!');
}

run().catch(console.error);
