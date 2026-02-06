import { NextResponse } from 'next/server';
import { getSessionToken, verifySession } from './session';
import { Role } from './permissions';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  sessionId: string;
}

/**
 * Require admin authentication for a route
 * Returns the admin user if authenticated, or throws a NextResponse error
 *
 * Usage in API routes:
 * const admin = await requireAdmin();
 * if (admin instanceof NextResponse) return admin;
 * // admin.id, admin.email, admin.name, admin.role are now available
 */
export async function requireAdmin(): Promise<AdminUser | NextResponse> {
  // Get session token from cookie
  const sessionToken = await getSessionToken();

  if (!sessionToken) {
    return NextResponse.json(
      { error: 'Unauthorized - No session' },
      { status: 401 }
    );
  }

  // Verify session and get user
  const session = await verifySession(sessionToken);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or expired session' },
      { status: 401 }
    );
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    sessionId: session.id,
  };
}
