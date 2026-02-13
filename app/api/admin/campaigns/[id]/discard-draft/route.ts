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

    // Delete the draft version
    const { error: deleteError } = await supabaseAdmin
      .from('campaign_versions')
      .delete()
      .eq('campaign_id', id)
      .eq('status', 'draft');

    if (deleteError) {
      console.error('Error deleting draft:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Update campaign to reflect no draft
    await supabaseAdmin
      .from('campaigns')
      .update({ has_draft: false })
      .eq('id', id);

    console.log(`[Campaign] Draft discarded by ${admin.email}: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error discarding draft:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
