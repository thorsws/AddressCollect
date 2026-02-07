import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load env before anything else
config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function cleanDatabase() {
  console.log('Starting database cleanup...\n');

  // 1. First, find the superadmin to preserve
  const { data: superAdmin } = await supabase
    .from('admin_users')
    .select('id, email')
    .eq('role', 'super_admin')
    .single();

  console.log('Super admin to preserve:', superAdmin?.email);

  // 2. Delete email_verifications (depends on claims)
  const { error: evErr } = await supabase
    .from('email_verifications')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (evErr) console.log('email_verifications error:', evErr.message);
  else console.log('✓ Deleted email_verifications');

  // 3. Delete all claims
  const { error: claimsErr } = await supabase
    .from('claims')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (claimsErr) console.log('claims error:', claimsErr.message);
  else console.log('✓ Deleted claims');

  // 4. Delete invite_codes (depends on campaigns)
  const { error: codesErr } = await supabase
    .from('invite_codes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (codesErr) console.log('invite_codes error:', codesErr.message);
  else console.log('✓ Deleted invite_codes');

  // 5. Delete all campaigns
  const { error: campaignsErr } = await supabase
    .from('campaigns')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (campaignsErr) console.log('campaigns error:', campaignsErr.message);
  else console.log('✓ Deleted campaigns');

  // 6. Delete admin_sessions
  const { error: sessionsErr } = await supabase
    .from('admin_sessions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (sessionsErr) console.log('admin_sessions error:', sessionsErr.message);
  else console.log('✓ Deleted admin_sessions');

  // 7. Delete admin_otp_requests
  const { error: otpErr } = await supabase
    .from('admin_otp_requests')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (otpErr) console.log('admin_otp_requests error:', otpErr.message);
  else console.log('✓ Deleted admin_otp_requests');

  // 8. Delete non-superadmin users
  if (superAdmin) {
    const { error: usersErr } = await supabase
      .from('admin_users')
      .delete()
      .neq('id', superAdmin.id);
    if (usersErr) console.log('admin_users error:', usersErr.message);
    else console.log('✓ Deleted non-superadmin users');
  }

  console.log('\n✓ Database cleaned. Super admin preserved:', superAdmin?.email);
}

cleanDatabase().catch(console.error);
