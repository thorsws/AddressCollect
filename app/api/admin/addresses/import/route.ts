import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateAddressFingerprint, normalizeEmail } from '@/lib/utils/address';

interface CsvRow {
  firstName: string;
  lastName: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

/**
 * Smart detection of header row by looking for expected column names
 */
function findHeaderRow(lines: string[]): number {
  const expectedColumns = [
    'full name', 'firstname', 'lastname', 'name',
    'email', 'address', 'street', 'city', 'state', 'region',
    'zip', 'postal', 'country'
  ];

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].toLowerCase();
    // Count how many expected columns are in this line
    const matches = expectedColumns.filter(col => line.includes(col)).length;

    // If we find 3 or more expected columns, this is likely the header
    if (matches >= 3) {
      console.log(`[CSV] Auto-detected header row at line ${i + 1} with ${matches} column matches`);
      return i;
    }
  }

  // Default to first row if no header detected
  console.log('[CSV] No header row detected, using first row');
  return 0;
}

/**
 * Parse CSV value, handling quoted fields properly
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const nextChar = line[j + 1];

    if (char === '"') {
      // Handle escaped quotes ("") - convert to single quote
      if (insideQuotes && nextChar === '"') {
        currentValue += '"';
        j++; // Skip the next quote
      } else {
        // Toggle quote state, but don't add the quote to the value
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim());

  return values;
}

interface ParseResult {
  rows: CsvRowWithDate[];
  validationErrors: Array<{ row: number; name: string; reason: string }>;
}

function parseCsv(csvText: string, skipRows: number = -1): ParseResult {
  // Split CSV into lines, but handle multi-line quoted fields
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if (char === '\n' && !insideQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else if (char === '\r') {
      // Skip \r characters
      continue;
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  console.log(`[CSV] Total lines after parsing: ${lines.length}`);

  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Auto-detect header row if skipRows is -1
  const headerRowIndex = skipRows === -1 ? findHeaderRow(lines) : skipRows;
  const headerLine = lines[headerRowIndex];
  const headers = parseCsvLine(headerLine).map(h => h.replace(/^"|"$/g, '').trim());

  console.log(`[CSV] Headers: ${headers.join(', ')}`);
  console.log(`[CSV] Processing ${lines.length - headerRowIndex - 1} data rows`);

  const rows: CsvRowWithDate[] = [];
  const validationErrors: Array<{ row: number; name: string; reason: string }> = [];

  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseCsvLine(line);

    const rawRow: any = {};
    headers.forEach((header, index) => {
      rawRow[header] = values[index] || '';
    });

    // Normalize to our expected format
    const result = normalizeRow(rawRow);
    if (result.row) {
      rows.push(result.row);
    } else {
      console.log(`[CSV] Row ${i + 1} skipped (failed normalization)`);
      const name = rawRow['Full Name'] || `${rawRow.firstName || ''} ${rawRow.lastName || ''}`.trim() || 'Unknown';
      validationErrors.push({
        row: i + 1,
        name,
        reason: result.error || 'Missing required fields',
      });
    }
  }

  console.log(`[CSV] Successfully normalized ${rows.length} rows`);

  return { rows, validationErrors };
}

interface CsvRowWithDate extends CsvRow {
  shippedDate?: string;
}

interface NormalizeResult {
  row: CsvRowWithDate | null;
  error?: string;
}

function normalizeRow(rawRow: any): NormalizeResult {
  // Handle "Full Name" column by splitting it
  let firstName = rawRow.firstName || rawRow.FirstName || '';
  let lastName = rawRow.lastName || rawRow.LastName || '';

  if (!firstName && !lastName && rawRow['Full Name']) {
    const nameParts = rawRow['Full Name'].trim().split(/\s+/);
    if (nameParts.length === 0) {
      return { row: null, error: 'Empty name' };
    }

    firstName = nameParts[0];
    lastName = nameParts.slice(1).join(' ') || nameParts[0]; // Use first name as last if only one name
  }

  if (!firstName || !lastName) {
    return { row: null, error: 'Missing first or last name' };
  }

  // Map various column name formats
  const email = rawRow.email || rawRow.Email || '';
  const company = rawRow.company || rawRow.Company || '';
  const title = rawRow.title || rawRow.Role || rawRow.Title || '';
  const phone = rawRow.phone || rawRow.Phone || '';

  // Handle address fields - could be in one field or split
  let address1 = rawRow.address1 || rawRow['Street Address 1'] || rawRow.Address || '';
  let address2 = rawRow.address2 || rawRow['Street Address 2'] || '';
  let city = rawRow.city || rawRow.City || '';
  let region = rawRow.region || rawRow.State || rawRow.state || '';
  let postalCode = rawRow.postalCode || rawRow.Zip || rawRow.zip || rawRow.PostalCode || '';
  let country = rawRow.country || rawRow.Country || 'US'; // Default to US

  // If city is missing, try to parse full address from address1
  if (!city && address1) {
    // Strategy 1: Address has commas - split and parse
    if (address1.includes(',')) {
      const addressParts = address1.split(',').map((s: string) => s.trim());

      if (addressParts.length >= 3) {
        // Format: "street, city, state zip" or "street, city state zip"
        address1 = addressParts[0];
        city = addressParts[1];

        // Parse "state zip" or "state, zip"
        const lastPart = addressParts[2];
        const stateZipMatch = lastPart.match(/^([A-Za-z\s]+?)\s+(\d{5}(?:-\d{4})?)$/);
        if (stateZipMatch) {
          region = stateZipMatch[1].trim();
          postalCode = stateZipMatch[2];
        } else {
          // Maybe it's just state, and zip is in next part
          region = lastPart;
          if (addressParts[3]) {
            postalCode = addressParts[3].trim();
          }
        }
      } else if (addressParts.length === 2) {
        // Format: "street city, state zip" (only one comma)
        // Try to parse "street city" part by finding last word as city
        const firstPart = addressParts[0]; // e.g., "179 Winter Drive Worthington"
        const secondPart = addressParts[1]; // e.g., "OH 43085"

        // Parse second part for state and zip
        const stateZipMatch = secondPart.match(/^([A-Za-z\s]+?)\s+(\d{5}(?:-\d{4})?)$/);
        if (stateZipMatch) {
          region = stateZipMatch[1].trim();
          postalCode = stateZipMatch[2];

          // Split first part to separate street from city (last word is city)
          const firstPartWords = firstPart.trim().split(/\s+/);
          if (firstPartWords.length >= 2) {
            city = firstPartWords[firstPartWords.length - 1]; // Last word is city
            address1 = firstPartWords.slice(0, -1).join(' '); // Everything else is street
          } else {
            // If only one word, use it as street and leave city empty (will fail validation)
            address1 = firstPart;
          }
        }
      }
    }
    // Strategy 2: No commas - use pattern matching for "street city STATE zip"
    else {
      // Try to match: "123 Street Name CityName ST 12345"
      // Look for ZIP code (5 digits, optionally followed by -4 digits)
      const zipMatch = address1.match(/\b(\d{5}(?:-\d{4})?)\s*$/);

      if (zipMatch) {
        postalCode = zipMatch[1];
        const beforeZip = address1.substring(0, zipMatch.index).trim();

        // Look for 2-letter state code before ZIP
        const stateMatch = beforeZip.match(/\b([A-Z]{2}|[A-Za-z]{2})\s*$/);

        if (stateMatch) {
          region = stateMatch[1].toUpperCase();
          const beforeState = beforeZip.substring(0, stateMatch.index).trim();

          // Split remaining into street + city
          // Assume last 1-2 words before state are city name
          const words = beforeState.split(/\s+/);
          if (words.length >= 3) {
            // Take last 1-2 words as city (heuristic: if last word is short, might be part of city)
            const lastWord = words[words.length - 1];
            const secondLastWord = words[words.length - 2];

            // Common patterns: "San Francisco", "Los Angeles", "New York"
            if (words.length >= 4 && (
              ['San', 'Los', 'New', 'Fort', 'Mount', 'St', 'St.'].includes(secondLastWord) ||
              lastWord.length <= 4 // Short word might be part of city
            )) {
              city = `${secondLastWord} ${lastWord}`;
              address1 = words.slice(0, -2).join(' ');
            } else {
              city = lastWord;
              address1 = words.slice(0, -1).join(' ');
            }
          } else if (words.length === 2) {
            // Only 2 words: "Street City"
            city = words[1];
            address1 = words[0];
          } else {
            // Only 1 word - can't separate
            address1 = beforeState;
          }
        }
      }
    }
  }

  // Extract shipped date from CSV if available
  const shippedDate = rawRow['Sent to Charlie Date?'] || rawRow['Shipped Date'] || '';

  // Validate required fields
  if (!address1 || !city || !region || !postalCode) {
    const missing = [];
    if (!address1) missing.push('address');
    if (!city) missing.push('city');
    if (!region) missing.push('state');
    if (!postalCode) missing.push('zip');

    const errorMsg = `Missing: ${missing.join(', ')}`;
    console.log('[CSV] Row failed validation:', {
      firstName,
      lastName,
      address1: address1 || '[MISSING]',
      city: city || '[MISSING]',
      region: region || '[MISSING]',
      postalCode: postalCode || '[MISSING]',
    });
    return { row: null, error: errorMsg };
  }

  return {
    row: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      company: company.trim() || undefined,
      title: title.trim() || undefined,
      phone: phone.trim() || undefined,
      address1: address1.trim(),
      address2: address2.trim() || undefined,
      city: city.trim(),
      region: region.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      shippedDate: shippedDate.trim() || undefined,
    }
  };
}

function parseShippedDate(dateStr: string, defaultYear: number = new Date().getFullYear()): Date | null {
  if (!dateStr) return null;

  // Handle formats like "Jan 30", "January 30", "1/30", "01/30/2024"
  const str = dateStr.trim();

  // Try parsing as ISO date first
  const isoDate = new Date(str);
  if (!isNaN(isoDate.getTime()) && str.includes('-')) {
    return isoDate;
  }

  // Handle "Jan 30" or "January 30" format
  const monthDayMatch = str.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
  if (monthDayMatch) {
    const monthStr = monthDayMatch[1];
    const day = parseInt(monthDayMatch[2]);
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = monthNames.findIndex(m => monthStr.toLowerCase().startsWith(m));

    if (monthIndex >= 0) {
      return new Date(defaultYear, monthIndex, day);
    }
  }

  // Handle "M/D" or "M/D/YYYY" format
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1]) - 1; // 0-indexed
    const day = parseInt(slashMatch[2]);
    const year = slashMatch[3] ? (slashMatch[3].length === 2 ? 2000 + parseInt(slashMatch[3]) : parseInt(slashMatch[3])) : defaultYear;
    return new Date(year, month, day);
  }

  return null;
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const campaignSlug = formData.get('campaignSlug') as string;
    const status = (formData.get('status') as string) || 'confirmed';
    const skipRows = parseInt(formData.get('skipRows') as string) || 0;
    const defaultShippedDate = formData.get('defaultShippedDate') as string; // Optional default date

    if (!file || !campaignSlug) {
      return NextResponse.json(
        { error: 'Missing file or campaign slug' },
        { status: 400 }
      );
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('slug', campaignSlug)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Read CSV file
    const csvText = await file.text();
    const parseResult = parseCsv(csvText, skipRows);
    const { rows, validationErrors } = parseResult;

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Add validation errors to errors array
    for (const valError of validationErrors) {
      errors.push(`Row ${valError.row} (${valError.name}): ${valError.reason}`);
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + skipRows + 2; // Account for skipped rows and header

      try {
        // Generate address fingerprint
        const addressFingerprint = generateAddressFingerprint(
          row.firstName,
          row.lastName,
          row.address1,
          row.city,
          row.region,
          row.postalCode,
          row.country
        );

        // Check for duplicate across ALL campaigns
        const { data: existingClaim } = await supabaseAdmin
          .from('claims')
          .select('id, campaign_id')
          .eq('address_fingerprint', addressFingerprint)
          .single();

        if (existingClaim) {
          skipped++;
          continue;
        }

        // Determine shipped_at date
        let shippedAt: string | null = null;
        if (status === 'shipped') {
          // Use date from CSV row if available
          if (row.shippedDate) {
            const parsedDate = parseShippedDate(row.shippedDate);
            shippedAt = parsedDate ? parsedDate.toISOString() : null;
          }
          // Otherwise use default shipped date from form
          if (!shippedAt && defaultShippedDate) {
            const parsedDate = parseShippedDate(defaultShippedDate);
            shippedAt = parsedDate ? parsedDate.toISOString() : null;
          }
          // Fall back to current date if no date specified
          if (!shippedAt) {
            shippedAt = new Date().toISOString();
          }
        }

        // Insert claim
        // Note: Status should always be 'confirmed' for imported addresses
        // Use shipped_at to track whether it's been shipped
        const { error: insertError } = await supabaseAdmin
          .from('claims')
          .insert({
            campaign_id: campaign.id,
            status: 'confirmed', // Always confirmed for imports
            first_name: row.firstName.trim(),
            last_name: row.lastName.trim(),
            email: row.email ? row.email.trim() : null,
            company: row.company ? row.company.trim() : null,
            title: row.title ? row.title.trim() : null,
            phone: row.phone ? row.phone.trim() : null,
            address1: row.address1.trim(),
            address2: row.address2 ? row.address2.trim() : null,
            city: row.city.trim(),
            region: row.region.trim(),
            postal_code: row.postalCode.trim(),
            country: row.country.trim(),
            email_normalized: row.email ? normalizeEmail(row.email) : null,
            address_fingerprint: addressFingerprint,
            confirmed_at: new Date().toISOString(),
            shipped_at: shippedAt,
          });

        if (insertError) {
          errors.push(`Row ${rowNumber}: Database error - ${insertError.message}`);
          continue;
        }

        imported++;

      } catch (rowError: any) {
        errors.push(`Row ${rowNumber}: ${rowError.message}`);
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors,
      total: rows.length,
    });

  } catch (error: any) {
    console.error('[Import] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import addresses' },
      { status: 500 }
    );
  }
}
