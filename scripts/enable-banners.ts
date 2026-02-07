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

async function enableBanners() {
  const { data, error } = await supabase
    .from('campaigns')
    .update({ show_banner: true })
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('slug, show_banner');

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Enabled banner for all campaigns:');
    data.forEach(c => console.log(`  ✓ ${c.slug}`));
  }
}

enableBanners().catch(console.error);
