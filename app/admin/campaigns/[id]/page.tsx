import { redirect, notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import EnhancedClaimsTable from './EnhancedClaimsTable';
import InviteCodesManager from './InviteCodesManager';
import PreCreateClaimForm from './PreCreateClaimForm';
import DeleteCampaignButton from './DeleteCampaignButton';
import QuestionsManager from './QuestionsManager';
import CampaignQRCode from './CampaignQRCode';
import PreviewCampaignButton from './PreviewCampaignButton';

export default async function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    redirect('/admin/login');
  }

  const { id } = await params;

  // Fetch campaign
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (campaignError || !campaign) {
    notFound();
  }

  // Fetch claims
  const { data: claims } = await supabaseAdmin
    .from('claims')
    .select('*')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false });

  // Fetch invite codes if campaign requires them
  let inviteCodes = [];
  if (campaign.require_invite_code) {
    const { data } = await supabaseAdmin
      .from('invite_codes')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false });
    inviteCodes = data || [];
  }

  // Fetch custom questions
  const { data: questions } = await supabaseAdmin
    .from('campaign_questions')
    .select('*')
    .eq('campaign_id', id)
    .order('display_order', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <a href="/admin" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                <img src="/logo.png" alt="Cognitive Kin" className="h-8 w-auto" />
                <span>← Dashboard</span>
              </a>
              <span className="text-gray-300">|</span>
              <h1 className="text-xl font-bold text-gray-900">{campaign.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <PreviewCampaignButton campaignSlug={campaign.slug} />
              <a
                href={`/admin/campaigns/${campaign.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
              >
                Edit Campaign
              </a>
              <a
                href={`/api/admin/campaigns/${campaign.id}/export`}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
              >
                Export CSV
              </a>
              {admin.role === 'super_admin' && (
                <DeleteCampaignButton campaignId={campaign.id} campaignTitle={campaign.title} />
              )}
              <span className="text-sm text-gray-600">{admin.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Info */}
        {(campaign.starts_at || campaign.ends_at || campaign.created_by) && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-wrap gap-6 text-sm">
              {campaign.created_by && (
                <div>
                  <span className="font-medium text-blue-800">Created by:</span>{' '}
                  <span className="text-blue-700">{campaign.created_by}</span>
                </div>
              )}
              {campaign.starts_at && (
                <div>
                  <span className="font-medium text-blue-800">Starts:</span>{' '}
                  <span className="text-blue-700">{new Date(campaign.starts_at).toLocaleString()}</span>
                </div>
              )}
              {campaign.ends_at && (
                <div>
                  <span className="font-medium text-blue-800">Ends:</span>{' '}
                  <span className="text-blue-700">{new Date(campaign.ends_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code Section */}
        <div className="mb-6">
          <CampaignQRCode campaignSlug={campaign.slug} campaignTitle={campaign.title} />
        </div>

        {/* Pre-create claim form - allows admin to create invite links */}
        <div className="mb-6">
          <PreCreateClaimForm campaignId={campaign.id} campaignSlug={campaign.slug} />
        </div>

        {campaign.require_invite_code && (
          <div className="mb-6">
            <InviteCodesManager campaignId={campaign.id} inviteCodes={inviteCodes} />
          </div>
        )}

        {/* Custom Questions */}
        <div className="mb-6">
          <QuestionsManager campaignId={campaign.id} initialQuestions={questions || []} />
        </div>

        <EnhancedClaimsTable
          claims={claims || []}
          capacity_total={campaign.capacity_total}
          campaignSlug={campaign.slug}
          userRole={admin.role}
        />
      </main>
    </div>
  );
}
