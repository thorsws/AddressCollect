/**
 * Timezone conversion utilities for Eastern Time (America/New_York)
 */

/**
 * Converts a UTC ISO string to Eastern Time for datetime-local input
 * Example: "2026-02-14T05:00:00.000Z" -> "2026-02-14T00:00"
 */
export function utcToEastern(utcIsoString: string): string {
  const date = new Date(utcIsoString);

  // Get the parts in Eastern Time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;
  const hour = parts.find(p => p.type === 'hour')!.value;
  const minute = parts.find(p => p.type === 'minute')!.value;

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Converts a datetime-local input value (in Eastern Time) to UTC ISO string
 * Example: "2026-02-14T00:00" -> "2026-02-14T05:00:00.000Z"
 */
export function easternToUtc(easternDatetimeLocal: string): string {
  // datetime-local format: "YYYY-MM-DDTHH:mm"
  // We need to parse this as if it were in America/New_York timezone

  // Create a date string that includes timezone info
  // We'll use the trick of formatting a known UTC date to see the offset
  const [datePart, timePart] = easternDatetimeLocal.split('T');

  // Create a formatter to parse in Eastern Time
  // The trick: format the string as if it's in Eastern Time, then get UTC
  const testDate = new Date(easternDatetimeLocal + ':00'); // Add seconds

  // Get what this same time would be in Eastern Time
  const easternFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Here's a cleaner approach: Use toLocaleString to create a string in Eastern Time,
  // then compare with UTC to find offset
  // Actually, simpler: Just add the offset manually

  // Parse the input
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  // Create a date in UTC that represents this Eastern Time
  // We need to determine if DST is in effect
  // Create a test date at noon on this day
  const testDateMidpoint = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  // Check the timezone offset for this date
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  });

  const formatted = formatter.format(testDateMidpoint);
  const isDST = formatted.includes('EDT');

  // EST is UTC-5, EDT is UTC-4
  const offsetHours = isDST ? 4 : 5;

  // Create UTC date by adding the offset
  const utcDate = new Date(Date.UTC(
    year,
    month - 1,
    day,
    hours + offsetHours,
    minutes
  ));

  return utcDate.toISOString();
}
