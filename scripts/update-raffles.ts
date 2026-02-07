import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

async function updateRaffles() {
  // Update Chalmers and SXSW - unlimited capacity, no scarcity
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      capacity_total: 0,  // 0 = unlimited
      show_scarcity: false
    })
    .in('slug', ['chalmers-alumni-usa', 'sxsw'])
    .select('slug, title, capacity_total, show_scarcity');

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Updated raffle campaigns:');
    data.forEach(c => console.log(`  ✓ ${c.slug}: show_scarcity=${c.show_scarcity}`));
  }
}

updateRaffles().catch(console.error);
