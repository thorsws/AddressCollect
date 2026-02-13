import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { canEditCampaign } from '@/lib/permissions/campaignAccess';

// POST - Revert campaign to a specific version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    const { version_number } = await request.json();

    if (!version_number) {
      return NextResponse.json(
        { error: 'version_number is required' },
        { status: 400 }
      );
    }

    // Fetch the campaign to check ownership
    const { data: existingCampaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, created_by, current_version')
      .eq('id', campaignId)
      .single();

    if (campaignError || !existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check permission to edit (checks campaign_members table)
    if (!(await canEditCampaign(admin.id, campaignId, admin.role))) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to edit this campaign' },
        { status: 403 }
      );
    }

    // Fetch the version to revert to
    const { data: versionToRevert, error: versionError } = await supabaseAdmin
      .from('campaign_versions')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('version_number', version_number)
      .single();

    if (versionError || !versionToRevert) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    const versionData = versionToRevert.data as Record<string, unknown>;
    const newVersion = (existingCampaign.current_version || 1) + 1;

    // Update the campaign with the reverted data
    const { data: campaign, error: updateError } = await supabaseAdmin
      .from('campaigns')
      .update({
        title: versionData.title,
        internal_title: versionData.internal_title,
        description: versionData.description,
        capacity_total: versionData.capacity_total,
        is_active: versionData.is_active,
        require_email: versionData.require_email,
        require_email_verification: versionData.require_email_verification,
        require_invite_code: versionData.require_invite_code,
        show_scarcity: versionData.show_scarcity,
        collect_company: versionData.collect_company,
        collect_phone: versionData.collect_phone,
        collect_title: versionData.collect_title,
        privacy_blurb: versionData.privacy_blurb,
        max_claims_per_email: versionData.max_claims_per_email,
        max_claims_per_ip_per_day: versionData.max_claims_per_ip_per_day,
        max_claims_per_address: versionData.max_claims_per_address,
        test_mode: versionData.test_mode,
        show_banner: versionData.show_banner,
        show_logo: versionData.show_logo,
        banner_url: versionData.banner_url,
        contact_email: versionData.contact_email,
        contact_text: versionData.contact_text,
        kiosk_mode: versionData.kiosk_mode,
        enable_questions: versionData.enable_questions,
        questions_intro_text: versionData.questions_intro_text,
        starts_at: versionData.starts_at,
        ends_at: versionData.ends_at,
        notes: versionData.notes,
        consent_text: versionData.consent_text,
        current_version: newVersion,
        has_draft: false,
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (updateError) {
      console.error('Error reverting campaign:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Delete any existing draft
    await supabaseAdmin
      .from('campaign_versions')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('status', 'draft');

    // Create a new version record for the revert
    await supabaseAdmin
      .from('campaign_versions')
      .insert({
        campaign_id: campaignId,
        version_number: newVersion,
        status: 'published',
        data: versionData,
        change_summary: `Reverted to version ${version_number}`,
        created_by: admin.id,
        published_at: new Date().toISOString(),
        published_by: admin.id,
      });

    console.log(`[Campaign] Reverted by ${admin.email}: ${campaignId} to version ${version_number} (new version ${newVersion})`);

    return NextResponse.json({
      campaign,
      message: `Reverted to version ${version_number}`,
      newVersion,
    });
  } catch (error: unknown) {
    console.error('Error in revert API:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
