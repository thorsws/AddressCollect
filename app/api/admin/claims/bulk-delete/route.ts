import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // Only super_admin can bulk delete
  if (admin.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Only super admins can delete claims' },
      { status: 403 }
    );
  }

  try {
    const { claimIds } = await request.json();

    if (!Array.isArray(claimIds) || claimIds.length === 0) {
      return NextResponse.json({ error: 'No claim IDs provided' }, { status: 400 });
    }

    // Delete all specified claims
    const { error, count } = await supabaseAdmin
      .from('claims')
      .delete()
      .in('id', claimIds);

    if (error) {
      console.error('Bulk delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Claims] Bulk delete by ${admin.email}: ${claimIds.length} claims deleted`);

    return NextResponse.json({
      success: true,
      deletedCount: count || claimIds.length
    });
  } catch (error: any) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
