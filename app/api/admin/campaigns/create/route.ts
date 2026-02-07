import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { canCreateCampaign } from '@/lib/admin/permissions';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return admin;
  }

  // Check permission to create campaigns
  if (!canCreateCampaign(admin.role)) {
    return NextResponse.json(
      { error: 'Forbidden - You do not have permission to create campaigns' },
      { status: 403 }
    );
  }

  try {
    const data = await request.json();

    // Validate required fields (capacity_total is optional - null/0 means unlimited)
    if (!data.slug || !data.title || !data.internal_title) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, internal_title' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('slug', data.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A campaign with this slug already exists' },
        { status: 400 }
      );
    }

    // Create campaign
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        slug: data.slug,
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
        show_logo: data.show_logo === true,
        enable_questions: data.enable_questions === true,
        notes: data.notes || null,
        created_by: admin.id,
        updated_by: admin.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error('Error in create campaign API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
