import { supabaseAdmin } from '@/lib/supabase/server';

export type CampaignRole = 'owner' | 'editor' | 'viewer' | null;

interface CampaignAccessResult {
  hasAccess: boolean;
  role: CampaignRole;
  canEdit: boolean;
  canGift: boolean;
  canManageMembers: boolean;
}

/**
 * Check a user's access level to a campaign
 * Returns the role and permission flags
 */
export async function getCampaignAccess(
  userId: string,
  campaignId: string,
  userRole?: string
): Promise<CampaignAccessResult> {
  // Super admins have full access to everything
  if (userRole === 'super_admin') {
    return {
      hasAccess: true,
      role: 'owner',
      canEdit: true,
      canGift: true,
      canManageMembers: true,
    };
  }

  // Check campaign_members for this user
  const { data: member } = await supabaseAdmin
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .single();

  if (!member) {
    return {
      hasAccess: false,
      role: null,
      canEdit: false,
      canGift: false,
      canManageMembers: false,
    };
  }

  const role = member.role as CampaignRole;

  return {
    hasAccess: true,
    role,
    canEdit: role === 'owner' || role === 'editor',
    canGift: role === 'owner' || role === 'editor',
    canManageMembers: role === 'owner',
  };
}

/**
 * Simple check if user has any access to campaign
 */
export async function hasAccessToCampaign(
  userId: string,
  campaignId: string,
  userRole?: string
): Promise<boolean> {
  const access = await getCampaignAccess(userId, campaignId, userRole);
  return access.hasAccess;
}

/**
 * Check if user can edit a campaign
 */
export async function canEditCampaign(
  userId: string,
  campaignId: string,
  userRole?: string
): Promise<boolean> {
  const access = await getCampaignAccess(userId, campaignId, userRole);
  return access.canEdit;
}

/**
 * Check if user can gift from a campaign
 */
export async function canGiftFromCampaign(
  userId: string,
  campaignId: string,
  userRole?: string
): Promise<boolean> {
  const access = await getCampaignAccess(userId, campaignId, userRole);
  return access.canGift;
}
