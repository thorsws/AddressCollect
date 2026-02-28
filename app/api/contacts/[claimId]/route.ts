import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// PATCH - Update contact fields (code-gated, no admin login required)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const key = request.nextUrl.searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Access code required' }, { status: 401 });
  }

  // Validate key against global settings
  const { data: setting } = await supabaseAdmin
    .from('global_settings')
    .select('value')
    .eq('key', 'contacts_key')
    .single();

  if (!setting || setting.value !== key) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
  }

  const { claimId } = await params;
  const data = await request.json();

  // Only allow updating specific fields
  const updateData: Record<string, string | boolean | null> = {};
  if (data.linkedin_url !== undefined) updateData.linkedin_url = data.linkedin_url || null;
  if (data.admin_notes !== undefined) updateData.admin_notes = data.admin_notes || null;
  if (data.title !== undefined) updateData.title = data.title || null;
  if (data.company !== undefined) updateData.company = data.company || null;
  if (data.is_lead !== undefined) updateData.is_lead = !!data.is_lead;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: claim, error } = await supabaseAdmin
    .from('claims')
    .update(updateData)
    .eq('id', claimId)
    .select('id, first_name, last_name, email, title, company, linkedin_url, admin_notes, is_lead')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claim });
}
