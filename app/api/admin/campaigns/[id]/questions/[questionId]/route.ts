import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

// PATCH - Update a question
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { questionId } = await params;

  try {
    const data = await request.json();

    const updateData: Record<string, unknown> = {};
    if (data.question_text !== undefined) updateData.question_text = data.question_text;
    if (data.is_required !== undefined) updateData.is_required = data.is_required;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;
    if (data.options !== undefined) updateData.options = data.options;

    const { data: question, error } = await supabaseAdmin
      .from('campaign_questions')
      .update(updateData)
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ question });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a question
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { questionId } = await params;

  try {
    const { error } = await supabaseAdmin
      .from('campaign_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
