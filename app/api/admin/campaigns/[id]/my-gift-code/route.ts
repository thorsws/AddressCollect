import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { stripHtml } from '@/lib/utils/stripHtml';
import crypto from 'crypto';

// Generate a short, URL-safe code
function generateCode(): string {
  return crypto.randomBytes(6).toString('base64url');
}

// GET - Fetch all gift codes for this admin for this campaign
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    // Check if campaign exists
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, slug, title, internal_title')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Fetch all codes for this admin for this campaign
    const { data: codes, error: codesError } = await supabaseAdmin
      .from('admin_gift_codes')
      .select('*')
      .eq('admin_id', admin.id)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (codesError) {
      console.error('Error fetching gift codes:', codesError);
      return NextResponse.json({ error: codesError.message }, { status: 500 });
    }

    // Get admin profile info
    const { data: adminProfile } = await supabaseAdmin
      .from('admin_users')
      .select('display_name, name, linkedin_url, bio, phone, email')
      .eq('id', admin.id)
      .single();

    return NextResponse.json({
      codes: codes || [],
      campaignSlug: campaign.slug,
      campaignTitle: campaign.internal_title || stripHtml(campaign.title),
      profile: {
        displayName: adminProfile?.display_name || adminProfile?.name || admin.name,
        email: adminProfile?.email,
        linkedinUrl: adminProfile?.linkedin_url,
        bio: adminProfile?.bio,
        phone: adminProfile?.phone,
      },
    });
  } catch (error: unknown) {
    console.error('Error in my-gift-code GET:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create a new gift code with configuration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    const body = await request.json();
    const {
      label,
      custom_message,
      show_name = true,
      show_linkedin = true,
      show_bio = false,
      show_phone = false,
      show_email = false,
      custom_display_name,
    } = body;

    // Check if campaign exists
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Generate new code
    const code = generateCode();

    const { data: newCode, error: insertError } = await supabaseAdmin
      .from('admin_gift_codes')
      .insert({
        admin_id: admin.id,
        campaign_id: campaignId,
        code,
        label: label || 'New QR Code',
        custom_message,
        show_name,
        show_linkedin,
        show_bio,
        show_phone,
        show_email,
        custom_display_name,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating gift code:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ code: newCode });
  } catch (error: unknown) {
    console.error('Error in my-gift-code POST:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Update an existing gift code
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    const body = await request.json();
    const {
      code_id,
      label,
      custom_message,
      show_name,
      show_linkedin,
      show_bio,
      show_phone,
      show_email,
      custom_display_name,
    } = body;

    if (!code_id) {
      return NextResponse.json({ error: 'code_id is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existingCode } = await supabaseAdmin
      .from('admin_gift_codes')
      .select('id')
      .eq('id', code_id)
      .eq('admin_id', admin.id)
      .eq('campaign_id', campaignId)
      .single();

    if (!existingCode) {
      return NextResponse.json({ error: 'Code not found or not owned by you' }, { status: 404 });
    }

    const { data: updatedCode, error: updateError } = await supabaseAdmin
      .from('admin_gift_codes')
      .update({
        label,
        custom_message,
        show_name,
        show_linkedin,
        show_bio,
        show_phone,
        show_email,
        custom_display_name,
      })
      .eq('id', code_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating gift code:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ code: updatedCode });
  } catch (error: unknown) {
    console.error('Error in my-gift-code PUT:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Delete a specific gift code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get('code_id');

    if (!codeId) {
      return NextResponse.json({ error: 'code_id is required' }, { status: 400 });
    }

    // Verify ownership and delete
    const { error } = await supabaseAdmin
      .from('admin_gift_codes')
      .delete()
      .eq('id', codeId)
      .eq('admin_id', admin.id)
      .eq('campaign_id', campaignId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in my-gift-code DELETE:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
