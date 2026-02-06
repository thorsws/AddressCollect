import { createHash, randomBytes } from 'crypto';

/**
 * Generate a secure hash of a value using SHA-256
 * Used for OTP hashes, session tokens, and IP addresses
 */
export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

/**
 * Generate a secure random session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash an IP address for privacy-preserving storage
 */
export function hashIP(ip: string): string {
  return hashValue(ip);
}

/**
 * Generate a secure random claim token for pre-created claims
 * Returns a URL-safe token
 */
export function generateClaimToken(): string {
  return randomBytes(24).toString('base64url');
}
