import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateClaimToken, hashValue } from '@/lib/crypto/hash';

// POST - Pre-create a claim with unique token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    const data = await request.json();

    // All fields are optional for pre-created claims

    // Fetch campaign to verify it exists and check permissions
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, created_by, slug')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check if user can create claims for this campaign
    // Allow if: super_admin OR (admin AND owns campaign)
    const canCreate = admin.role === 'super_admin' ||
                     (admin.role === 'admin' && campaign.created_by === admin.id);

    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to pre-create claims for this campaign' },
        { status: 403 }
      );
    }

    // Generate unique claim token
    const claimToken = generateClaimToken();

    // Generate a placeholder fingerprint for pre-created claims (will be updated when address is submitted)
    const placeholderFingerprint = hashValue(`preclaim:${claimToken}`);

    // Create pre-claim record
    const { data: claim, error } = await supabaseAdmin
      .from('claims')
      .insert({
        campaign_id: campaignId,
        claim_token: claimToken,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || null,
        company: data.company || null,
        title: data.title || null,
        phone: data.phone || null,
        admin_notes: data.admin_notes || null,
        status: 'pending', // Pre-created claims start as pending
        pre_created_by: admin.id,
        address_fingerprint: placeholderFingerprint, // Placeholder until address is submitted
        // Address fields are empty until user submits
        address1: '',
        city: '',
        region: '',
        postal_code: '',
        country: 'US',
      })
      .select()
      .single();

    if (error) {
      console.error('Error pre-creating claim:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate the claim URL
    const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const claimUrl = `${appUrl}/c/${campaign.slug}/claim/${claimToken}`;

    console.log(`[Pre-Claim] Created by ${admin.email} - Token: ${claimToken}`);

    return NextResponse.json({
      claim,
      claimUrl,
    });
  } catch (error: any) {
    console.error('Error in pre-create claim API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
