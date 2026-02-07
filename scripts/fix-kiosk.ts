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

async function fixKiosk() {
  // Disable kiosk mode for all campaigns first
  await supabase
    .from('campaigns')
    .update({ kiosk_mode: false })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  // Enable only for SIA (staffing-industry)
  const { data, error } = await supabase
    .from('campaigns')
    .update({ kiosk_mode: true })
    .eq('slug', 'staffing-industry')
    .select('slug, kiosk_mode');

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Kiosk mode enabled only for:');
    data.forEach(c => console.log(`  ✓ ${c.slug}`));
  }
}

fixKiosk().catch(console.error);
