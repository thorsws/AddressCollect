import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { canEditCampaign } from '@/lib/permissions/campaignAccess';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return admin;
  }

  const { id } = await params;

  try {
    // Fetch the campaign
    const { data: campaign, error: fetchError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check permission (checks campaign_members table)
    if (!(await canEditCampaign(admin.id, id, admin.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the draft version
    const { data: draftVersion, error: draftError } = await supabaseAdmin
      .from('campaign_versions')
      .select('*')
      .eq('campaign_id', id)
      .eq('status', 'draft')
      .single();

    if (draftError || !draftVersion) {
      return NextResponse.json({ error: 'No draft found' }, { status: 404 });
    }

    const draftData = draftVersion.data as Record<string, unknown>;
    const newVersion = draftVersion.version_number;

    // Update the campaign with draft data
    const { error: updateError } = await supabaseAdmin
      .from('campaigns')
      .update({
        ...draftData,
        current_version: newVersion,
        has_draft: false,
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating campaign:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update the draft version to published
    const { error: versionError } = await supabaseAdmin
      .from('campaign_versions')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: admin.id,
      })
      .eq('id', draftVersion.id);

    if (versionError) {
      console.error('Error updating version:', versionError);
    }

    console.log(`[Campaign] Draft published by ${admin.email}: ${id} (version ${newVersion})`);
    return NextResponse.json({ success: true, version: newVersion });
  } catch (error: unknown) {
    console.error('Error publishing draft:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
