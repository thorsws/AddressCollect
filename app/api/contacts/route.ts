import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET - Fetch all contacts (code-gated, no admin login required)
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Access code required' }, { status: 401 });
  }

  // Validate key against global settings
  const { data: setting } = await supabaseAdmin
    .from('global_settings')
    .select('value')
    .eq('key', 'contacts_key')
    .single();

  if (!setting || setting.value !== key) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
  }

  // Fetch all non-test claims with addresses
  const { data: claims, error } = await supabaseAdmin
    .from('claims')
    .select('id, first_name, last_name, email, title, company, linkedin_url, admin_notes, is_lead, campaign_id, created_at')
    .eq('is_test_claim', false)
    .neq('address1', '')
    .not('address1', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch campaign names
  const campaignIds = [...new Set((claims || []).map(c => c.campaign_id))];
  const { data: campaigns } = await supabaseAdmin
    .from('campaigns')
    .select('id, internal_title')
    .in('id', campaignIds.length > 0 ? campaignIds : ['none']);

  const campaignMap: Record<string, string> = {};
  (campaigns || []).forEach(c => {
    campaignMap[c.id] = c.internal_title;
  });

  const contacts = (claims || []).map(claim => ({
    ...claim,
    campaign_name: campaignMap[claim.campaign_id] || 'Unknown',
  }));

  return NextResponse.json({ contacts });
}
