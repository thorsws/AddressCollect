import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

// PATCH - Update invite code (toggle active status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; codeId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { codeId } = await params;

  try {
    const data = await request.json();

    const { data: inviteCode, error } = await supabaseAdmin
      .from('invite_codes')
      .update({
        is_active: data.is_active,
      })
      .eq('id', codeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating invite code:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inviteCode });
  } catch (error: any) {
    console.error('Error in invite code PATCH:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete an invite code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; codeId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { codeId } = await params;

  try {
    const { error } = await supabaseAdmin
      .from('invite_codes')
      .delete()
      .eq('id', codeId);

    if (error) {
      console.error('Error deleting invite code:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in invite code DELETE:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
