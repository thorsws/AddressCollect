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

function parseCsv(csvText: string, skipRows: number = 0): CsvRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < skipRows + 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Skip the specified number of rows and get headers
  const headerLine = lines[skipRows];
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  const rows: CsvRow[] = [];

  for (let i = skipRows + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parsing (handles quotes)
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    const rawRow: any = {};
    headers.forEach((header, index) => {
      rawRow[header] = values[index] || '';
    });

    // Normalize to our expected format
    const row = normalizeRow(rawRow);
    if (row) {
      rows.push(row);
    }
  }

  return rows;
}

function normalizeRow(rawRow: any): CsvRow | null {
  // Handle "Full Name" column by splitting it
  let firstName = rawRow.firstName || rawRow.FirstName || '';
  let lastName = rawRow.lastName || rawRow.LastName || '';

  if (!firstName && !lastName && rawRow['Full Name']) {
    const nameParts = rawRow['Full Name'].trim().split(/\s+/);
    if (nameParts.length === 0) return null;

    firstName = nameParts[0];
    lastName = nameParts.slice(1).join(' ') || nameParts[0]; // Use first name as last if only one name
  }

  if (!firstName || !lastName) return null;

  // Map various column name formats
  const email = rawRow.email || rawRow.Email || '';
  const company = rawRow.company || rawRow.Company || '';
  const title = rawRow.title || rawRow.Role || rawRow.Title || '';
  const phone = rawRow.phone || rawRow.Phone || '';

  // Handle address fields - could be in one field or split
  let address1 = rawRow.address1 || rawRow['Street Address 1'] || rawRow.Address || '';
  let address2 = rawRow.address2 || rawRow['Street Address 2'] || '';

  // If address is in one field with comma, try to split it
  if (address1 && address1.includes(',') && !rawRow['Street Address 1']) {
    const addressParts = address1.split(',').map((s: string) => s.trim());
    if (addressParts.length >= 3) {
      // Format: "street, city, state zip"
      address1 = addressParts[0];
    }
  }

  const city = rawRow.city || rawRow.City || '';
  const region = rawRow.region || rawRow.State || rawRow.state || '';
  const postalCode = rawRow.postalCode || rawRow.Zip || rawRow.zip || rawRow.PostalCode || '';
  const country = rawRow.country || rawRow.Country || 'US'; // Default to US

  // Validate required fields
  if (!address1 || !city || !region || !postalCode) {
    return null;
  }

  return {
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
  };
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
    const rows = parseCsv(csvText, skipRows);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

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

        // Insert claim
        const { error: insertError } = await supabaseAdmin
          .from('claims')
          .insert({
            campaign_id: campaign.id,
            status: status,
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
            confirmed_at: status === 'confirmed' || status === 'shipped' ? new Date().toISOString() : null,
            shipped_at: status === 'shipped' ? new Date().toISOString() : null,
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
