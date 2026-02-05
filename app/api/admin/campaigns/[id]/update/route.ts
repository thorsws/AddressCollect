import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return admin;
  }

  const { id } = await params;

  try {
    const data = await request.json();

    // Update campaign
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .update({
        title: data.title,
        description: data.description || null,
        capacity_total: parseInt(data.capacity_total),
        is_active: data.is_active !== false,
        require_email: data.require_email !== false,
        require_email_verification: data.require_email_verification === true,
        require_invite_code: data.require_invite_code === true,
        show_scarcity: data.show_scarcity !== false,
        collect_company: data.collect_company === true,
        collect_phone: data.collect_phone === true,
        collect_title: data.collect_title === true,
        privacy_blurb: data.privacy_blurb || null,
        max_claims_per_email: parseInt(data.max_claims_per_email) || 1,
        max_claims_per_ip_per_day: parseInt(data.max_claims_per_ip_per_day) || 5,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating campaign:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error('Error in update campaign API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
