import { NextResponse } from 'next/server';
import { getSessionToken, revokeSession, clearSessionCookie } from '@/lib/admin/session';

export async function POST() {
  try {
    const sessionToken = await getSessionToken();

    if (sessionToken) {
      // Revoke the session in the database
      await revokeSession(sessionToken);
    }

    // Clear the cookie
    await clearSessionCookie();

    console.log('[Auth] Admin logged out');
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('[Auth] Error in logout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
