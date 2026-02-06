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

// DELETE - Delete claim (super_admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // Only super_admin can delete claims
  if (admin.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Only super admins can delete claims' },
      { status: 403 }
    );
  }

  const { claimId } = await params;

  try {
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

    console.log(`[Claim] Deleted by ${admin.email}: ${claimId}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in claim DELETE:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
