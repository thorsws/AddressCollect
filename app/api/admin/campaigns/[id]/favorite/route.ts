import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  // Check if campaign exists
  const { data: campaign, error: fetchError } = await supabaseAdmin
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .single();

  if (fetchError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Check if already favorited by this user
  const { data: existing } = await supabaseAdmin
    .from('campaign_favorites')
    .select('id')
    .eq('user_id', admin.id)
    .eq('campaign_id', campaignId)
    .single();

  if (existing) {
    // Remove favorite
    const { error: deleteError } = await supabaseAdmin
      .from('campaign_favorites')
      .delete()
      .eq('user_id', admin.id)
      .eq('campaign_id', campaignId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
    }

    return NextResponse.json({ is_favorited: false });
  } else {
    // Add favorite
    const { error: insertError } = await supabaseAdmin
      .from('campaign_favorites')
      .insert({ user_id: admin.id, campaign_id: campaignId });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }

    return NextResponse.json({ is_favorited: true });
  }
}
