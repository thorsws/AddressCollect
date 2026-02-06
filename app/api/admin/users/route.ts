import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { canManageUsers } from '@/lib/admin/permissions';
import { sendInviteEmail } from '@/lib/mailgun';

// GET - List all users
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // Check permission
  if (!canManageUsers(admin.role)) {
    return NextResponse.json(
      { error: 'Forbidden - You do not have permission to manage users' },
      { status: 403 }
    );
  }

  try {
    const { data: users, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, name, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error in users GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create/invite new user
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // Check permission
  if (!canManageUsers(admin.role)) {
    return NextResponse.json(
      { error: 'Forbidden - You do not have permission to manage users' },
      { status: 403 }
    );
  }

  try {
    const data = await request.json();

    // Validate required fields
    if (!data.email || !data.name || !data.role) {
      return NextResponse.json(
        { error: 'Email, name, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['super_admin', 'admin', 'viewer'];
    if (!validRoles.includes(data.role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const normalizedEmail = data.email.toLowerCase().trim();

    // Check if user already exists
    const { data: existing } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user
    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .insert({
        email: normalizedEmail,
        name: data.name,
        role: data.role,
        is_active: true,
        created_by: admin.id,
        updated_by: admin.id,
      })
      .select('id, email, name, role, is_active, created_at')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send invite email
    try {
      await sendInviteEmail(user.email, user.name, data.role);
    } catch (emailError: any) {
      console.error('Error sending invite email:', emailError);
      // Don't fail the user creation if email fails
    }

    console.log(`[Users] User created: ${user.email} (${user.role}) by ${admin.email}`);
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Error in users POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
