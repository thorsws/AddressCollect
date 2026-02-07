import { createHash } from 'crypto';

/**
 * Normalize and create a fingerprint for an address
 * Used for deduplication
 */
export function generateAddressFingerprint(
  firstName: string,
  lastName: string,
  address1: string,
  city: string,
  region: string,
  postalCode: string,
  country: string
): string {
  // Normalize all fields
  const normalized = [
    firstName.trim().toLowerCase(),
    lastName.trim().toLowerCase(),
    address1.trim().toLowerCase().replace(/[^\w\s]/g, ''), // Remove punctuation
    city.trim().toLowerCase(),
    region.trim().toLowerCase(),
    postalCode.trim().replace(/\s/g, ''), // Remove spaces from postal code
    country.trim().toUpperCase(),
  ].join('|');

  // Create SHA-256 hash
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Generate location fingerprint (address only, without person name)
 * Used to count how many different people are at the same address
 */
export function generateLocationFingerprint(
  address1: string,
  city: string,
  region: string,
  postalCode: string,
  country: string
): string {
  // Normalize all fields (excluding name)
  const normalized = [
    address1.trim().toLowerCase().replace(/[^\w\s]/g, ''), // Remove punctuation
    city.trim().toLowerCase(),
    region.trim().toLowerCase(),
    postalCode.trim().replace(/\s/g, ''), // Remove spaces from postal code
    country.trim().toUpperCase(),
  ].join('|');

  // Create SHA-256 hash
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Normalize email for deduplication
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate postal code format (basic validation)
 */
export function validatePostalCode(postalCode: string, country: string): boolean {
  const trimmed = postalCode.trim();

  // US ZIP code
  if (country === 'US') {
    return /^\d{5}(-\d{4})?$/.test(trimmed);
  }

  // Canadian postal code
  if (country === 'CA') {
    return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(trimmed);
  }

  // UK postcode
  if (country === 'GB' || country === 'UK') {
    return /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(trimmed);
  }

  // For other countries, just check it's not empty
  return trimmed.length > 0;
}
