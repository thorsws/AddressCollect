import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateSessionToken, hashValue } from '@/lib/crypto/hash';

const SESSION_COOKIE_NAME = 'admin_session';
const DEFAULT_SESSION_TTL_DAYS = 7;

/**
 * Create a new admin session
 */
export async function createSession(
  email: string,
  ipHash: string,
  userAgent: string | null
): Promise<string> {
  // Generate session token
  const sessionToken = generateSessionToken();
  const sessionTokenHash = hashValue(sessionToken);

  // Calculate expiration
  const ttlDays = parseInt(process.env.ADMIN_SESSION_TTL_DAYS || String(DEFAULT_SESSION_TTL_DAYS));
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  // Store session in database
  const { error } = await supabaseAdmin
    .from('admin_sessions')
    .insert({
      email,
      session_token_hash: sessionTokenHash,
      expires_at: expiresAt,
      ip_hash: ipHash,
      user_agent: userAgent,
    });

  if (error) {
    console.error('[Session] Failed to create session:', error);
    throw new Error('Failed to create session');
  }

  return sessionToken;
}

/**
 * Set the session cookie
 */
export async function setSessionCookie(sessionToken: string): Promise<void> {
  const ttlDays = parseInt(process.env.ADMIN_SESSION_TTL_DAYS || String(DEFAULT_SESSION_TTL_DAYS));
  const maxAge = ttlDays * 24 * 60 * 60; // in seconds

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

/**
 * Get the session token from cookie
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Verify and get session from token
 */
export async function verifySession(sessionToken: string) {
  const sessionTokenHash = hashValue(sessionToken);

  const { data: session, error } = await supabaseAdmin
    .from('admin_sessions')
    .select('*')
    .eq('session_token_hash', sessionTokenHash)
    .is('revoked_at', null)
    .single();

  if (error || !session) {
    return null;
  }

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    return null;
  }

  return session;
}

/**
 * Revoke a session (logout)
 */
export async function revokeSession(sessionToken: string): Promise<void> {
  const sessionTokenHash = hashValue(sessionToken);

  await supabaseAdmin
    .from('admin_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('session_token_hash', sessionTokenHash);
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
