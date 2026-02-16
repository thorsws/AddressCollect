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
    return NextResponse.json({ error: 'Only super admins can hide campaigns' }, { status: 403 });
  }

  const { id: campaignId } = await params;

  const { data: campaign, error: fetchError } = await supabaseAdmin
    .from('campaigns')
    .select('is_hidden')
    .eq('id', campaignId)
    .single();

  if (fetchError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const newValue = !campaign.is_hidden;

  const { error: updateError } = await supabaseAdmin
    .from('campaigns')
    .update({ is_hidden: newValue })
    .eq('id', campaignId);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update hidden status' }, { status: 500 });
  }

  return NextResponse.json({ is_hidden: newValue });
}
