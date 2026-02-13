import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { canEditCampaign } from '@/lib/admin/permissions';

// Helper to build campaign data object for versioning
function buildCampaignData(data: Record<string, unknown>) {
  return {
    title: data.title,
    internal_title: data.internal_title,
    slug: data.slug,
    description: data.description !== undefined ? data.description : null,
    capacity_total: data.capacity_total ? parseInt(String(data.capacity_total)) : 0,
    is_active: data.is_active !== false,
    require_email: data.require_email !== false,
    require_email_verification: data.require_email_verification === true,
    require_invite_code: data.require_invite_code === true,
    show_scarcity: data.show_scarcity !== false,
    collect_company: data.collect_company === true,
    collect_phone: data.collect_phone === true,
    collect_title: data.collect_title === true,
    collect_linkedin: data.collect_linkedin === true,
    show_feature_section: data.show_feature_section === true,
    feature_image_url: data.feature_image_url !== undefined ? data.feature_image_url : null,
    feature_paragraph: data.feature_paragraph !== undefined ? data.feature_paragraph : null,
    privacy_blurb: data.privacy_blurb !== undefined ? data.privacy_blurb : null,
    show_privacy_blurb: data.show_privacy_blurb !== false,
    max_claims_per_email: parseInt(String(data.max_claims_per_email)) || 1,
    max_claims_per_ip_per_day: parseInt(String(data.max_claims_per_ip_per_day)) || 5,
    max_claims_per_address: parseInt(String(data.max_claims_per_address)) || 1,
    test_mode: data.test_mode === true,
    show_banner: data.show_banner === true,
    show_logo: data.show_logo === true,
    banner_url: data.banner_url !== undefined ? data.banner_url : null,
    contact_email: data.contact_email !== undefined ? data.contact_email : null,
    contact_text: data.contact_text !== undefined ? data.contact_text : null,
    kiosk_mode: data.kiosk_mode === true,
    enable_questions: data.enable_questions === true,
    questions_intro_text: data.questions_intro_text !== undefined ? data.questions_intro_text : null,
    starts_at: data.starts_at || null,
    ends_at: data.ends_at || null,
    notes: data.notes !== undefined ? data.notes : null,
    consent_text: data.consent_text !== undefined ? data.consent_text : null,
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return admin;
  }

  const { id } = await params;

  try {
    // Fetch the campaign to check ownership and current version
    const { data: existingCampaign, error: fetchError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check permission to edit
    if (!canEditCampaign(admin.role, existingCampaign.created_by, admin.id)) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to edit this campaign' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const saveAsDraft = data.save_as_draft === true;
    const changeSummary = data.change_summary || null;

    // Build the campaign update object
    const campaignUpdate = {
      ...buildCampaignData(data),
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    };

    // Get current version number
    const currentVersion = existingCampaign.current_version || 1;
    const newVersion = currentVersion + 1;

    if (saveAsDraft) {
      // Save as draft - don't update main campaign, just create/update draft version
      // First, delete any existing draft for this campaign
      await supabaseAdmin
        .from('campaign_versions')
        .delete()
        .eq('campaign_id', id)
        .eq('status', 'draft');

      // Create new draft version
      const { error: versionError } = await supabaseAdmin
        .from('campaign_versions')
        .insert({
          campaign_id: id,
          version_number: newVersion,
          status: 'draft',
          data: buildCampaignData(data),
          change_summary: changeSummary,
          created_by: admin.id,
        });

      if (versionError) {
        console.error('Error creating draft version:', versionError);
        return NextResponse.json({ error: versionError.message }, { status: 500 });
      }

      // Mark campaign as having a draft
      await supabaseAdmin
        .from('campaigns')
        .update({ has_draft: true })
        .eq('id', id);

      return NextResponse.json({
        campaign: existingCampaign,
        message: 'Draft saved',
        isDraft: true,
        version: newVersion,
      });
    } else {
      // Publish - update the main campaign and create a published version

      // Update the campaign
      const { data: campaign, error } = await supabaseAdmin
        .from('campaigns')
        .update({
          ...campaignUpdate,
          current_version: newVersion,
          has_draft: false,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Delete any existing draft
      await supabaseAdmin
        .from('campaign_versions')
        .delete()
        .eq('campaign_id', id)
        .eq('status', 'draft');

      // Create published version record
      const { error: versionError } = await supabaseAdmin
        .from('campaign_versions')
        .insert({
          campaign_id: id,
          version_number: newVersion,
          status: 'published',
          data: buildCampaignData(data),
          change_summary: changeSummary,
          created_by: admin.id,
          published_at: new Date().toISOString(),
          published_by: admin.id,
        });

      if (versionError) {
        console.error('Error creating version record:', versionError);
        // Don't fail the request, version history is secondary
      }

      console.log(`[Campaign] Updated by ${admin.email}: ${id} (version ${newVersion})`);
      return NextResponse.json({
        campaign,
        message: 'Published',
        version: newVersion,
      });
    }
  } catch (error: unknown) {
    console.error('Error in update campaign API:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
