import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

// PATCH - Update claim (admin notes, shipped status, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { claimId } = await params;

  try {
    const data = await request.json();

    // Build update object
    const updateData: any = {};

    if (data.admin_notes !== undefined) updateData.admin_notes = data.admin_notes;
    if (data.shipped_at !== undefined) {
      updateData.shipped_at = data.shipped_at ? new Date().toISOString() : null;
    }
    if (data.status !== undefined) updateData.status = data.status;

    // Allow editing pre-created claim info
    if (data.first_name !== undefined) updateData.first_name = data.first_name;
    if (data.last_name !== undefined) updateData.last_name = data.last_name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.phone !== undefined) updateData.phone = data.phone;

    const { data: claim, error } = await supabaseAdmin
      .from('claims')
      .update(updateData)
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      console.error('Error updating claim:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Claim] Updated by ${admin.email}: ${claimId}`);
    return NextResponse.json({ claim });
  } catch (error: any) {
    console.error('Error in claim PATCH:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete claim (super_admin for all, any admin for pre-created)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { claimId } = await params;

  try {
    // Fetch the claim with campaign info
    const { data: claim, error: fetchError } = await supabaseAdmin
      .from('claims')
      .select('id, address1, claim_token, campaign_id')
      .eq('id', claimId)
      .single();

    if (fetchError || !claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Check permissions: super_admin can delete any.
    // Campaign owners/editors can delete claims in their campaigns.
    // Others can only delete pre-created (no address).
    const isPreCreated = claim.claim_token && !claim.address1;
    if (admin.role !== 'super_admin' && !isPreCreated) {
      // Check if admin has edit access to this campaign
      const { data: campaign } = await supabaseAdmin
        .from('campaigns')
        .select('created_by')
        .eq('id', claim.campaign_id)
        .single();

      const { data: membership } = await supabaseAdmin
        .from('campaign_members')
        .select('role')
        .eq('campaign_id', claim.campaign_id)
        .eq('user_id', admin.id)
        .single();

      const canEdit = campaign?.created_by === admin.id ||
                      membership?.role === 'owner' ||
                      membership?.role === 'editor';

      if (!canEdit) {
        return NextResponse.json(
          { error: 'You do not have permission to delete claims in this campaign' },
          { status: 403 }
        );
      }
    }

    // First delete any email verifications for this claim
    await supabaseAdmin
      .from('email_verifications')
      .delete()
      .eq('claim_id', claimId);

    // Delete the claim
    const { error } = await supabaseAdmin
      .from('claims')
      .delete()
      .eq('id', claimId);

    if (error) {
      console.error('Error deleting claim:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Claim] Deleted by ${admin.email}: ${claimId}${isPreCreated ? ' (pre-created)' : ''}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in claim DELETE:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
