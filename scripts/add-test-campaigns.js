#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

async function addTestCampaigns() {
  console.log('🌱 Adding test campaigns...\n');

  // Check if campaigns already exist
  const { data: existing } = await supabase
    .from('campaigns')
    .select('slug')
    .in('slug', ['stanford', 'partner-event']);

  if (existing && existing.length > 0) {
    console.log('⏭️  Test campaigns already exist!');
    console.log('   - /c/stanford');
    console.log('   - /c/partner-event');
    return;
  }

  // Insert Stanford campaign
  console.log('Creating Stanford campaign...');
  const { data: stanford, error: error1 } = await supabase
    .from('campaigns')
    .insert({
      slug: 'stanford',
      title: 'Stanford Book Giveaway',
      description: "Get your free copy of our book! We'll ship it directly to you.",
      capacity_total: 100,
      is_active: true,
      require_email: true,
      require_email_verification: false,
      require_invite_code: false,
      show_scarcity: true,
      collect_company: false,
      privacy_blurb: "We only use your address to ship the book. We won't sell your information."
    })
    .select()
    .single();

  if (error1) {
    console.error('❌ Stanford campaign failed:', error1.message);
  } else {
    console.log('✅ Stanford campaign created!');
    console.log('   📍 http://localhost:3000/c/stanford');
  }

  // Insert Partner Event campaign
  console.log('\nCreating Partner Event campaign...');
  const { data: partner, error: error2 } = await supabase
    .from('campaigns')
    .insert({
      slug: 'partner-event',
      title: 'Partner Event Book Voucher',
      description: 'Thanks for attending our partner event! Claim your book voucher.',
      capacity_total: 50,
      is_active: true,
      require_email: true,
      require_email_verification: true,
      require_invite_code: true,
      show_scarcity: true,
      collect_company: true,
      collect_phone: true,
      collect_title: true,
      privacy_blurb: 'Your information is only used to fulfill your book voucher. We respect your privacy.'
    })
    .select()
    .single();

  if (error2) {
    console.error('❌ Partner Event campaign failed:', error2.message);
  } else {
    console.log('✅ Partner Event campaign created!');
    console.log('   📍 http://localhost:3000/c/partner-event');

    // Add invite codes for partner-event
    console.log('\nAdding invite codes...');
    const { error: codeError1 } = await supabase
      .from('invite_codes')
      .insert({
        campaign_id: partner.id,
        code: 'PARTNER2026',
        max_uses: 25,
        is_active: true
      });

    const { error: codeError2 } = await supabase
      .from('invite_codes')
      .insert({
        campaign_id: partner.id,
        code: 'VIP2026',
        max_uses: 10,
        is_active: true
      });

    if (codeError1 || codeError2) {
      console.log('⚠️  Some invite codes may have failed');
    } else {
      console.log('✅ Invite codes added: PARTNER2026, VIP2026');
    }
  }

  console.log('\n✨ Test campaigns ready!');
  console.log('\nYou can now:');
  console.log('1. Visit http://localhost:3000/c/stanford');
  console.log('2. Visit http://localhost:3000/c/partner-event (needs invite code)');
  console.log('3. Login to admin at http://localhost:3000/admin/login');
}

addTestCampaigns();
