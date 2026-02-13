import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET - Get version history for a campaign
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    // Fetch all versions for this campaign
    const { data: versions, error } = await supabaseAdmin
      .from('campaign_versions')
      .select(`
        id,
        version_number,
        status,
        data,
        change_summary,
        created_at,
        published_at,
        created_by,
        published_by,
        creator:admin_users!created_by(id, name, email),
        publisher:admin_users!published_by(id, name, email)
      `)
      .eq('campaign_id', campaignId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Error fetching versions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get current campaign info
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('current_version, has_draft')
      .eq('id', campaignId)
      .single();

    return NextResponse.json({
      versions: versions || [],
      currentVersion: campaign?.current_version || 1,
      hasDraft: campaign?.has_draft || false,
    });
  } catch (error: unknown) {
    console.error('Error in versions GET:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
