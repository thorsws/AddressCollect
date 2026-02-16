import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { stripHtml } from '@/lib/utils/stripHtml';
import RegisterForm from './RegisterForm';
import Link from 'next/link';

export default async function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    redirect('/admin/login');
  }

  const { id: campaignId } = await params;

  // Fetch campaign
  const { data: campaign, error } = await supabaseAdmin
    .from('campaigns')
    .select('id, slug, title, internal_title, created_by, capacity_total, test_mode')
    .eq('id', campaignId)
    .single();

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Campaign Not Found</h1>
          <Link href="/admin" className="text-blue-600 hover:underline">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Permission check
  const { data: membership } = await supabaseAdmin
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', campaignId)
    .eq('user_id', admin.id)
    .single();

  const memberRole = membership?.role;
  const canEdit = admin.role === 'super_admin' ||
                  campaign.created_by === admin.id ||
                  memberRole === 'owner' ||
                  memberRole === 'editor';

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to register people for this campaign.</p>
          <Link href="/admin" className="text-blue-600 hover:underline">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Fetch all confirmed/pending claims with address (not pre-created empty ones)
  const { data: claims } = await supabaseAdmin
    .from('claims')
    .select('id, first_name, last_name, email, phone, company, title, linkedin_url, address1, address2, city, region, postal_code, country, status, pre_created_by, is_test_claim, created_at, admin_notes')
    .eq('campaign_id', campaignId)
    .eq('is_test_claim', false)
    .neq('address1', '')
    .order('created_at', { ascending: false });

  const confirmedCount = (claims || []).filter(c => c.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/admin/campaigns/${campaignId}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            &larr; Back to Campaign
          </Link>
          <span className="text-sm text-gray-500">{admin.email}</span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-1">Register People</h1>
        <p className="text-gray-600 text-sm mb-6">
          {campaign.internal_title || stripHtml(campaign.title)}
        </p>

        <RegisterForm
          campaignId={campaign.id}
          capacityTotal={campaign.capacity_total}
          initialClaims={claims || []}
          initialConfirmedCount={confirmedCount}
        />
      </div>
    </div>
  );
}
