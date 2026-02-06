import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { canExportCampaign } from '@/lib/admin/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // Check permission to export
  if (!canExportCampaign(admin.role)) {
    return NextResponse.json(
      { error: 'Forbidden - You do not have permission to export campaigns' },
      { status: 403 }
    );
  }

  const { id } = await params;

  // Fetch campaign
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json(
      { error: 'Campaign not found' },
      { status: 404 }
    );
  }

  // Fetch all claims for this campaign
  const { data: claims, error: claimsError } = await supabaseAdmin
    .from('claims')
    .select('*')
    .eq('campaign_id', id)
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
    'Status',
    'Test Claim',
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

  const rows = claims?.map(claim => [
    campaign.slug,
    claim.status,
    claim.is_test_claim ? 'Yes' : 'No',
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
      'Content-Disposition': `attachment; filename="${campaign.slug}-claims-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
