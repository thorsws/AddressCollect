import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { claimIds, shipped_at } = await request.json();

    if (!Array.isArray(claimIds) || claimIds.length === 0) {
      return NextResponse.json({ error: 'No claim IDs provided' }, { status: 400 });
    }

    // Update all claims
    const { error } = await supabaseAdmin
      .from('claims')
      .update({ shipped_at: shipped_at || null })
      .in('id', claimIds);

    if (error) {
      console.error('Bulk update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Claims] Bulk update by ${admin.email}: ${claimIds.length} claims, shipped_at=${shipped_at ? 'set' : 'cleared'}`);

    return NextResponse.json({
      success: true,
      updatedCount: claimIds.length
    });
  } catch (error: any) {
    console.error('Error in bulk update:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
