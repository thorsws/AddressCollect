import { NextResponse } from 'next/server';
import { getSessionToken, verifySession } from './session';

export interface AdminUser {
  email: string;
  sessionId: string;
}

/**
 * Require admin authentication for a route
 * Returns the admin user if authenticated, or throws a NextResponse error
 *
 * Usage in API routes:
 * const admin = await requireAdmin();
 * if (admin instanceof NextResponse) return admin;
 * // admin.email is now available
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

  // Verify session
  const session = await verifySession(sessionToken);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or expired session' },
      { status: 401 }
    );
  }

  // Check if email is still in allowlist
  const allowlist = process.env.ADMIN_EMAIL_ALLOWLIST?.split(',').map(e => e.trim().toLowerCase()) || [];
  if (!allowlist.includes(session.email.toLowerCase())) {
    return NextResponse.json(
      { error: 'Unauthorized - Access revoked' },
      { status: 403 }
    );
  }

  return {
    email: session.email,
    sessionId: session.id,
  };
}
