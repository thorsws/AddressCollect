import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // Fetch all claims with campaign info
  const { data: claims, error: claimsError } = await supabaseAdmin
    .from('claims')
    .select(`
      *,
      campaigns (
        slug,
        title
      )
    `)
    .order('created_at', { ascending: false });

  if (claimsError) {
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    );
  }

  // Generate CSV
  const headers = [
    'Campaign Slug',
    'Campaign Title',
    'Status',
    'First Name',
    'Last Name',
    'Email',
    'Company',
    'Title',
    'Phone',
    'Address Line 1',
    'Address Line 2',
    'City',
    'State/Region',
    'Postal Code',
    'Country',
    'Invite Code',
    'Created At',
    'Confirmed At',
  ];

  const rows = claims?.map((claim: any) => [
    claim.campaigns?.slug || '',
    claim.campaigns?.title || '',
    claim.status,
    claim.first_name,
    claim.last_name,
    claim.email || '',
    claim.company || '',
    claim.title || '',
    claim.phone || '',
    claim.address1,
    claim.address2 || '',
    claim.city,
    claim.region,
    claim.postal_code,
    claim.country,
    claim.invite_code || '',
    claim.created_at,
    claim.confirmed_at || '',
  ]) || [];

  // Escape CSV values
  const escapeCsvValue = (value: string) => {
    if (!value) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsvValue).join(',')),
  ].join('\n');

  // Return CSV file
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="all-addresses-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
