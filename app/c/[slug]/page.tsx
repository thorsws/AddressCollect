import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import CampaignForm from './CampaignForm';

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch campaign data
  const { data: campaign, error } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !campaign) {
    notFound();
  }

  // Check if campaign is within date window
  const now = new Date();
  if (campaign.start_at && new Date(campaign.start_at) > now) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full p-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
            <p className="text-gray-600">
              This campaign has not started yet. Please check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (campaign.end_at && new Date(campaign.end_at) < now) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full p-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
            <p className="text-gray-600">
              This campaign has ended. Thank you for your interest.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get current claim count for scarcity
  let claimCount = 0;
  if (campaign.show_scarcity) {
    const { count } = await supabaseAdmin
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .eq('status', 'confirmed');

    claimCount = count || 0;
  }

  // Check if capacity is full
  const isFull = claimCount >= campaign.capacity_total;

  if (isFull) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full p-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
            <p className="text-gray-600 text-lg mb-2">
              All slots have been claimed!
            </p>
            <p className="text-gray-500 text-sm">
              Thank you for your interest. Unfortunately, we&apos;ve reached our capacity for this campaign.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
            {campaign.description && (
              <p className="text-gray-600 mb-6">{campaign.description}</p>
            )}

            {campaign.show_scarcity && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-900 font-medium">
                  {campaign.capacity_total - claimCount} of {campaign.capacity_total} spots remaining
                </p>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-900 font-semibold mb-2">Privacy Promise</h3>
              <p className="text-green-800 text-sm">
                {campaign.privacy_blurb ||
                  "We only use your address to ship the book. We won't sell your information."}
              </p>
            </div>
          </div>

          <CampaignForm campaign={campaign} />
        </div>
      </div>
    </div>
  );
}
