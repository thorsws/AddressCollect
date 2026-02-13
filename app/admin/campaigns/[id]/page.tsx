import { redirect, notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { stripHtml } from '@/lib/utils/stripHtml';
import EnhancedClaimsTable from './EnhancedClaimsTable';
import InviteCodesManager from './InviteCodesManager';
import PreCreateClaimForm from './PreCreateClaimForm';
import DeleteCampaignButton from './DeleteCampaignButton';
import CampaignQRCode from './CampaignQRCode';
import PreviewCampaignButton from './PreviewCampaignButton';
import VersionHistory from './VersionHistory';
import CampaignMembers from './CampaignMembers';

export default async function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    redirect('/admin/login');
  }

  const { id } = await params;

  // Fetch campaign with creator info
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .select(`
      *,
      creator:admin_users!created_by(id, email, name)
    `)
    .eq('id', id)
    .single();

  if (campaignError || !campaign) {
    notFound();
  }

  // Check if user is a campaign member with edit access
  const { data: membership } = await supabaseAdmin
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', id)
    .eq('user_id', admin.id)
    .single();

  const memberRole = membership?.role;
  const canEdit = admin.role === 'super_admin' ||
                  campaign.created_by === admin.id ||
                  memberRole === 'owner' ||
                  memberRole === 'editor';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top row: Logo + Dashboard link | User email */}
          <div className="flex justify-between items-center h-12 border-b border-gray-200">
            <a
              href="/admin"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 sm:bg-transparent bg-blue-50 sm:px-0 px-3 py-1.5 rounded-md"
            >
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <img src="/cognitive-kin-logo.svg" alt="Cognitive Kin" className="h-6 w-auto hidden sm:block" />
              <span className="hidden sm:inline">← Dashboard</span>
              <span className="sm:hidden text-sm font-medium">Back</span>
            </a>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <a href="/admin/settings" className="text-sm text-gray-500 hover:text-gray-700">
                Settings
              </a>
              <span className="hidden sm:inline text-sm text-gray-600">{admin.email}</span>
            </div>
          </div>

          {/* Bottom row: Campaign title | Action buttons */}
          <div className="py-4">
            {/* Title - full width on mobile */}
            <div className="mb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{campaign.internal_title}</h1>
              <a
                href={`/c/${campaign.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 mt-1 inline-block"
              >
                Public: {stripHtml(campaign.title)}
              </a>
            </div>

            {/* Action buttons - grid on mobile, flex row on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 lg:gap-3">
              <PreviewCampaignButton campaignSlug={campaign.slug} />
              <a
                href={`/admin/campaigns/${campaign.id}/gift`}
                className="px-3 py-2 bg-purple-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-purple-700 text-center"
              >
                Gift a Book
              </a>
              <a
                href={`/admin/campaigns/${campaign.id}/my-qr`}
                className="px-3 py-2 bg-indigo-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-indigo-700 text-center"
                title="Your permanent QR code for this campaign"
              >
                My QR Code
              </a>
              {canEdit && (
                <a
                  href={`/admin/campaigns/${campaign.id}/edit`}
                  className="px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-blue-700 text-center"
                >
                  Edit Campaign
                </a>
              )}
              <a
                href={`/api/admin/campaigns/${campaign.id}/export`}
                className="px-3 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-green-700 text-center"
              >
                Export CSV
              </a>
              {admin.role === 'super_admin' && (
                <DeleteCampaignButton campaignId={campaign.id} campaignTitle={stripHtml(campaign.title)} />
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Campaign Info */}
        <div className="mb-4 sm:mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm">
            <div>
              <span className="font-medium text-blue-800">Internal Title:</span>{' '}
              <span className="text-blue-700">{campaign.internal_title}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Slug:</span>{' '}
              <span className="text-blue-700">/c/{campaign.slug}</span>
            </div>
            {campaign.created_by && (
              <div>
                <span className="font-medium text-blue-800">Created by:</span>{' '}
                <span className="text-blue-700">
                  {campaign.creator?.name || campaign.creator?.email || 'Unknown'}
                </span>
              </div>
            )}
            {campaign.starts_at && (
              <div>
                <span className="font-medium text-blue-800">Starts:</span>{' '}
                <span className="text-blue-700">
                  {new Date(campaign.starts_at).toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
            {campaign.ends_at && (
              <div>
                <span className="font-medium text-blue-800">Ends:</span>{' '}
                <span className="text-blue-700">
                  {new Date(campaign.ends_at).toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
          {campaign.notes && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <span className="font-medium text-blue-800">Internal Notes:</span>
              <p className="text-blue-700 text-sm mt-1 whitespace-pre-wrap">{campaign.notes}</p>
            </div>
          )}
        </div>

        {/* Version History */}
        <div className="mb-4 sm:mb-6">
          <VersionHistory
            campaignId={campaign.id}
            canEdit={canEdit}
          />
        </div>

        {/* Team Members */}
        <div className="mb-4 sm:mb-6">
          <CampaignMembers campaignId={campaign.id} currentUserId={admin.id} />
        </div>

        {/* QR Code Section */}
        <div className="mb-4 sm:mb-6">
          <CampaignQRCode campaignSlug={campaign.slug} campaignTitle={stripHtml(campaign.title)} />
        </div>

        {/* Pre-create claim form - allows admin to create invite links */}
        <div className="mb-4 sm:mb-6">
          <PreCreateClaimForm campaignId={campaign.id} campaignSlug={campaign.slug} />
        </div>

        {campaign.require_invite_code && (
          <div className="mb-4 sm:mb-6">
            <InviteCodesManager campaignId={campaign.id} inviteCodes={inviteCodes} />
          </div>
        )}

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
