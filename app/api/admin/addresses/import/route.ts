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

function parseCsv(csvText: string): CsvRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
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

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row);
  }

  return rows;
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const campaignSlug = formData.get('campaignSlug') as string;

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
    const rows = parseCsv(csvText);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because of 0-index and header row

      try {
        // Validate required fields
        if (!row.firstName || !row.lastName || !row.address1 || !row.city || !row.region || !row.postalCode || !row.country) {
          errors.push(`Row ${rowNumber}: Missing required fields`);
          continue;
        }

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

        // Check for duplicate
        const { data: existingClaim } = await supabaseAdmin
          .from('claims')
          .select('id')
          .eq('campaign_id', campaign.id)
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
            status: 'confirmed',
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
