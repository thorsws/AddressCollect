/**
 * Permission helper functions for role-based access control
 */

export type Role = 'super_admin' | 'admin' | 'viewer';

/**
 * Can the user manage other users (invite, edit, delete)?
 * Only super_admins can manage users.
 */
export function canManageUsers(role: Role): boolean {
  return role === 'super_admin';
}

/**
 * Can the user create new campaigns?
 * Super admins and admins can create campaigns.
 */
export function canCreateCampaign(role: Role): boolean {
  return role === 'super_admin' || role === 'admin';
}

/**
 * Can the user edit a specific campaign?
 * Super admins can edit any campaign.
 * Admins can only edit campaigns they created.
 * Viewers cannot edit campaigns.
 */
export function canEditCampaign(role: Role, createdBy: string | null, userId: string): boolean {
  if (role === 'super_admin') return true;
  if (role === 'admin' && createdBy === userId) return true;
  return false;
}

/**
 * Can the user delete a campaign?
 * Same permissions as editing.
 */
export function canDeleteCampaign(role: Role, createdBy: string | null, userId: string): boolean {
  return canEditCampaign(role, createdBy, userId);
}

/**
 * Can the user view all campaigns?
 * All roles can view all campaigns.
 */
export function canViewCampaigns(role: Role): boolean {
  return true;
}

/**
 * Can the user export campaign data?
 * Super admins and admins can export (viewers cannot).
 */
export function canExportCampaign(role: Role): boolean {
  return role === 'super_admin' || role === 'admin';
}

/**
 * Can the user manage invite codes for campaigns?
 * Super admins and admins can manage invite codes.
 */
export function canManageInviteCodes(role: Role): boolean {
  return role === 'super_admin' || role === 'admin';
}

/**
 * Can the user import addresses?
 * Super admins and admins can import.
 */
export function canImportAddresses(role: Role): boolean {
  return role === 'super_admin' || role === 'admin';
}
