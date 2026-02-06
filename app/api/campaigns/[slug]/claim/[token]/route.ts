import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET - Fetch pre-created claim by token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  const { slug, token } = await params;

  try {
    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('slug', slug)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Fetch pre-created claim by token
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('claims')
      .select('id, first_name, last_name, email, company, title, phone, address1, city, region, postal_code, country, address2')
      .eq('claim_token', token)
      .eq('campaign_id', campaign.id)
      .single();

    if (claimError || !claim) {
      return NextResponse.json(
        { error: 'Claim not found or invalid token' },
        { status: 404 }
      );
    }

    // Check if claim already has an address (already submitted)
    if (claim.address1) {
      return NextResponse.json(
        { error: 'This claim has already been submitted' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      campaign,
      claim,
    });
  } catch (error: any) {
    console.error('Error fetching pre-created claim:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
