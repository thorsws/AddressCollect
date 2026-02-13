/**
 * Strip HTML tags from a string and return plain text
 * @param html - String that may contain HTML tags
 * @returns Plain text with HTML tags removed
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}
