import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can manage leaderboard visibility' }, { status: 403 });
  }

  const { id: campaignId } = await params;

  // Get current leaderboard status
  const { data: campaign, error: fetchError } = await supabaseAdmin
    .from('campaigns')
    .select('show_in_leaderboard')
    .eq('id', campaignId)
    .single();

  if (fetchError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Toggle
  const newValue = !campaign.show_in_leaderboard;

  const { error: updateError } = await supabaseAdmin
    .from('campaigns')
    .update({ show_in_leaderboard: newValue })
    .eq('id', campaignId);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update leaderboard visibility' }, { status: 500 });
  }

  return NextResponse.json({ show_in_leaderboard: newValue });
}
