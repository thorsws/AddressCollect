import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

// DELETE - Delete campaign (super_admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // Only super_admin can delete campaigns
  if (admin.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Only super admins can delete campaigns' },
      { status: 403 }
    );
  }

  const { id: campaignId } = await params;

  try {
    // Check if campaign has any claims
    const { count: claimCount } = await supabaseAdmin
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    if (claimCount && claimCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete campaign with ${claimCount} claims. Delete claims first or reject them.` },
        { status: 400 }
      );
    }

    // Delete invite codes first
    await supabaseAdmin
      .from('invite_codes')
      .delete()
      .eq('campaign_id', campaignId);

    // Delete the campaign
    const { error } = await supabaseAdmin
      .from('campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) {
      console.error('Error deleting campaign:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Campaign] Deleted by ${admin.email}: ${campaignId}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in campaign DELETE:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
