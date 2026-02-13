import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

// Check if user has owner permission on campaign
async function isOwner(userId: string, campaignId: string): Promise<boolean> {
  // Super admins are always owners
  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('role')
    .eq('id', userId)
    .single();

  if (admin?.role === 'super_admin') return true;

  // Check campaign_members for owner role
  const { data: member } = await supabaseAdmin
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .single();

  return member?.role === 'owner';
}

// GET - List all members of a campaign
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    // Check if user has access to this campaign
    const hasAccess = await isOwner(admin.id, campaignId) || admin.role === 'super_admin';

    // Anyone with access can view members (for now, we'll restrict adding/removing)
    const { data: members, error } = await supabaseAdmin
      .from('campaign_members')
      .select(`
        id,
        role,
        created_at,
        user:admin_users!user_id(id, email, name, display_name)
      `)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also get list of all admin users (for adding new members)
    const { data: allAdmins } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, name, display_name')
      .order('name', { ascending: true });

    return NextResponse.json({
      members: members || [],
      availableAdmins: allAdmins || [],
      canManage: hasAccess,
    });
  } catch (error: unknown) {
    console.error('Error in campaign members GET:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Add a member to a campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    // Check if user is owner
    const hasPermission = await isOwner(admin.id, campaignId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Only campaign owners can add members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (!['owner', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user exists
    const { data: targetUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add or update member
    const { data: member, error } = await supabaseAdmin
      .from('campaign_members')
      .upsert({
        campaign_id: campaignId,
        user_id,
        role,
        invited_by: admin.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'campaign_id,user_id',
      })
      .select(`
        id,
        role,
        created_at,
        user:admin_users!user_id(id, email, name, display_name)
      `)
      .single();

    if (error) {
      console.error('Error adding member:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member });
  } catch (error: unknown) {
    console.error('Error in campaign members POST:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Update a member's role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    // Check if user is owner
    const hasPermission = await isOwner(admin.id, campaignId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Only campaign owners can update members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { member_id, role } = body;

    if (!member_id) {
      return NextResponse.json({ error: 'member_id is required' }, { status: 400 });
    }

    if (!['owner', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update member
    const { data: member, error } = await supabaseAdmin
      .from('campaign_members')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', member_id)
      .eq('campaign_id', campaignId)
      .select(`
        id,
        role,
        created_at,
        user:admin_users!user_id(id, email, name, display_name)
      `)
      .single();

    if (error) {
      console.error('Error updating member:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member });
  } catch (error: unknown) {
    console.error('Error in campaign members PUT:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Remove a member from a campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: campaignId } = await params;

  try {
    // Check if user is owner
    const hasPermission = await isOwner(admin.id, campaignId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Only campaign owners can remove members' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');

    if (!memberId) {
      return NextResponse.json({ error: 'member_id is required' }, { status: 400 });
    }

    // Get the member to check if they're the last owner
    const { data: memberToRemove } = await supabaseAdmin
      .from('campaign_members')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('campaign_id', campaignId)
      .single();

    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Don't allow removing the last owner
    if (memberToRemove.role === 'owner') {
      const { count } = await supabaseAdmin
        .from('campaign_members')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('role', 'owner');

      if (count && count <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner. Transfer ownership first.' },
          { status: 400 }
        );
      }
    }

    // Remove member
    const { error } = await supabaseAdmin
      .from('campaign_members')
      .delete()
      .eq('id', memberId)
      .eq('campaign_id', campaignId);

    if (error) {
      console.error('Error removing member:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in campaign members DELETE:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
