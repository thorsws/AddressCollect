import { headers } from 'next/headers';

/**
 * Get the client IP address from the request
 * Handles various proxy headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Check various headers for the real IP
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIP = headersList.get('x-real-ip');
  const cfConnectingIP = headersList.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback
  return 'unknown';
}

/**
 * Get the user agent from the request
 */
export async function getUserAgent(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('user-agent');
}
