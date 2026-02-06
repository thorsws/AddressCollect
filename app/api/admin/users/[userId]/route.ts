import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { canManageUsers } from '@/lib/admin/permissions';

// PATCH - Update user role or status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // Check permission
  if (!canManageUsers(admin.role)) {
    return NextResponse.json(
      { error: 'Forbidden - You do not have permission to manage users' },
      { status: 403 }
    );
  }

  const { userId } = await params;

  try {
    const data = await request.json();

    // Don't allow users to modify themselves
    if (userId === admin.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own account' },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (data.role && !['super_admin', 'admin', 'viewer'].includes(data.role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    };

    if (data.role !== undefined) updateData.role = data.role;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.name !== undefined) updateData.name = data.name;

    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, name, role, is_active, created_at')
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Users] User updated: ${user.email} by ${admin.email}`);
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Error in user PATCH:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // Check permission
  if (!canManageUsers(admin.role)) {
    return NextResponse.json(
      { error: 'Forbidden - You do not have permission to manage users' },
      { status: 403 }
    );
  }

  const { userId } = await params;

  try {
    // Don't allow users to delete themselves
    if (userId === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user has created any campaigns
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('created_by', userId)
      .limit(1);

    if (campaignsError) {
      console.error('Error checking user campaigns:', campaignsError);
      return NextResponse.json({ error: campaignsError.message }, { status: 500 });
    }

    if (campaigns && campaigns.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user who has created campaigns' },
        { status: 400 }
      );
    }

    // Fetch user info before deleting
    const { data: user } = await supabaseAdmin
      .from('admin_users')
      .select('email')
      .eq('id', userId)
      .single();

    // Delete user
    const { error } = await supabaseAdmin
      .from('admin_users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Users] User deleted: ${user?.email} by ${admin.email}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in user DELETE:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
