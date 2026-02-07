import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return admin;
  }

  try {
    const { data: campaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('id, slug, title')
      .order('title');

    if (error) throw error;

    return NextResponse.json({
      campaigns: campaigns || [],
    });
  } catch (error) {
    console.error('[API] Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
