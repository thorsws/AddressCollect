import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET - List questions for a campaign
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  const { data: questions, error } = await supabaseAdmin
    .from('campaign_questions')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('display_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions });
}

// POST - Create a new question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    const data = await request.json();

    // Get max display_order
    const { data: existing } = await supabaseAdmin
      .from('campaign_questions')
      .select('display_order')
      .eq('campaign_id', campaignId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

    const { data: question, error } = await supabaseAdmin
      .from('campaign_questions')
      .insert({
        campaign_id: campaignId,
        question_text: data.question_text,
        question_type: data.question_type,
        is_required: data.is_required || false,
        display_order: nextOrder,
        options: data.question_type === 'multiple_choice' ? data.options : null,
      })
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
