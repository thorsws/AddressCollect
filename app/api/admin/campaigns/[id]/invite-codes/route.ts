import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET - List all invite codes for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;

  try {
    const { data: inviteCodes, error } = await supabaseAdmin
      .from('invite_codes')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invite codes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inviteCodes });
  } catch (error: any) {
    console.error('Error in invite codes GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new invite code
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;

  try {
    const data = await request.json();

    // Validate required fields
    if (!data.code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Check if code already exists for this campaign
    const { data: existing } = await supabaseAdmin
      .from('invite_codes')
      .select('id')
      .eq('campaign_id', id)
      .eq('code', data.code.toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This code already exists for this campaign' },
        { status: 400 }
      );
    }

    // Create invite code
    const { data: inviteCode, error } = await supabaseAdmin
      .from('invite_codes')
      .insert({
        campaign_id: id,
        code: data.code.toUpperCase(),
        max_uses: data.max_uses || null,
        uses: 0,
        is_active: true,
        created_by: admin.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invite code:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inviteCode });
  } catch (error: any) {
    console.error('Error in invite codes POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
