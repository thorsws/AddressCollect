import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET - Fetch current admin's profile
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, name, display_name, linkedin_url, bio, phone')
      .eq('id', admin.id)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Update admin's profile
export async function PUT(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const data = await request.json();

    // Only allow updating specific profile fields
    const allowedFields = ['display_name', 'linkedin_url', 'bio', 'phone'];
    const updateData: Record<string, string | null> = {};

    for (const field of allowedFields) {
      if (field in data) {
        // Trim strings, convert empty strings to null
        const value = typeof data[field] === 'string' ? data[field].trim() : data[field];
        updateData[field] = value === '' ? null : value;
      }
    }

    // Validate LinkedIn URL if provided
    if (updateData.linkedin_url) {
      const linkedinUrl = updateData.linkedin_url;
      if (!linkedinUrl.startsWith('https://www.linkedin.com/') &&
          !linkedinUrl.startsWith('https://linkedin.com/')) {
        return NextResponse.json(
          { error: 'LinkedIn URL must start with https://www.linkedin.com/ or https://linkedin.com/' },
          { status: 400 }
        );
      }
    }

    const { data: profile, error } = await supabaseAdmin
      .from('admin_users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
      })
      .eq('id', admin.id)
      .select('id, email, name, display_name, linkedin_url, bio, phone')
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
