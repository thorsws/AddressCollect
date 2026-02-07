import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { canEditCampaign } from '@/lib/admin/permissions';

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
    // Fetch the campaign to check ownership
    const { data: existingCampaign, error: fetchError } = await supabaseAdmin
      .from('campaigns')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check permission to edit
    if (!canEditCampaign(admin.role, existingCampaign.created_by, admin.id)) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to edit this campaign' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Update campaign
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .update({
        title: data.title,
        internal_title: data.internal_title,
        description: data.description || null,
        capacity_total: data.capacity_total ? parseInt(data.capacity_total) : 0,
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
        test_mode: data.test_mode === true,
        show_banner: data.show_banner === true,
        banner_url: data.banner_url || null,
        contact_email: data.contact_email || null,
        contact_text: data.contact_text || null,
        kiosk_mode: data.kiosk_mode === true,
        enable_questions: data.enable_questions === true,
        starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : null,
        ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
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
