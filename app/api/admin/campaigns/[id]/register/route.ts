import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateAddressFingerprint, generateLocationFingerprint, normalizeEmail } from '@/lib/utils/address';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    const data = await request.json();

    // Validate required fields
    const { first_name, last_name, address1, city, region, postal_code, country } = data;
    if (!first_name || !last_name || !address1 || !city || !region || !postal_code || !country) {
      return NextResponse.json(
        { error: 'Missing required fields: first name, last name, and full address are required' },
        { status: 400 }
      );
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, created_by, slug, capacity_total, test_mode')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Permission check: super_admin, creator, or campaign member with owner/editor role
    const { data: membership } = await supabaseAdmin
      .from('campaign_members')
      .select('role')
      .eq('campaign_id', campaignId)
      .eq('user_id', admin.id)
      .single();

    const memberRole = membership?.role;
    const canEdit = admin.role === 'super_admin' ||
                    campaign.created_by === admin.id ||
                    memberRole === 'owner' ||
                    memberRole === 'editor';

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate fingerprints
    const addressFingerprint = generateAddressFingerprint(
      first_name, last_name, address1, city, region, postal_code, country
    );
    const locationFingerprint = generateLocationFingerprint(
      address1, city, region, postal_code, country
    );

    // Check for duplicate address in this campaign
    const { data: existingClaim } = await supabaseAdmin
      .from('claims')
      .select('id, first_name, last_name')
      .eq('campaign_id', campaignId)
      .eq('address_fingerprint', addressFingerprint)
      .single();

    if (existingClaim) {
      return NextResponse.json(
        { error: `A claim with this name and address already exists (${existingClaim.first_name} ${existingClaim.last_name})` },
        { status: 409 }
      );
    }

    // Check capacity
    if (campaign.capacity_total) {
      const { count } = await supabaseAdmin
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .in('status', ['confirmed', 'pending'])
        .eq('is_test_claim', false);

      if ((count || 0) >= campaign.capacity_total) {
        return NextResponse.json(
          { error: 'Campaign is at capacity' },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();

    // Insert confirmed claim
    const { data: claim, error } = await supabaseAdmin
      .from('claims')
      .insert({
        campaign_id: campaignId,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: data.email?.trim() || null,
        email_normalized: data.email ? normalizeEmail(data.email) : null,
        phone: data.phone?.trim() || null,
        company: data.company?.trim() || null,
        title: data.title?.trim() || null,
        linkedin_url: data.linkedin_url?.trim() || null,
        address1: address1.trim(),
        address2: data.address2?.trim() || null,
        city: city.trim(),
        region: region.trim(),
        postal_code: postal_code.trim(),
        country: country.trim(),
        admin_notes: data.admin_notes?.trim() || null,
        status: 'confirmed',
        confirmed_at: now,
        pre_created_by: admin.id,
        is_test_claim: campaign.test_mode || false,
        address_fingerprint: addressFingerprint,
        location_fingerprint: locationFingerprint,
        consent_given: true,
        consent_timestamp: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating registration claim:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get updated confirmed count
    const { count: totalConfirmed } = await supabaseAdmin
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'confirmed')
      .eq('is_test_claim', false);

    return NextResponse.json({
      claim,
      totalConfirmed: totalConfirmed || 0,
      capacityTotal: campaign.capacity_total,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in register API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
