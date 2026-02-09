import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import CampaignForm from './CampaignForm';
import BannerPreview from './BannerPreview';
import ReactMarkdown from 'react-markdown';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const { data: campaign } = await supabaseAdmin
    .from('campaigns')
    .select('title, description')
    .eq('slug', slug)
    .single();

  if (!campaign) {
    return {
      title: 'Campaign Not Found',
    };
  }

  return {
    title: campaign.title,
    description: campaign.description || `Claim your spot for ${campaign.title}`,
    openGraph: {
      title: campaign.title,
      description: campaign.description || `Claim your spot for ${campaign.title}`,
      siteName: 'Cognitive Kin',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: campaign.title,
      description: campaign.description || `Claim your spot for ${campaign.title}`,
    },
  };
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch campaign data
  const { data: campaign, error } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !campaign) {
    notFound();
  }

  // Check if campaign is within date window or inactive (both show preview mode)
  const now = new Date();
  const notYetStarted = campaign.starts_at && new Date(campaign.starts_at) > now;
  const isInactive = !campaign.is_active;
  const submissionsDisabled = notYetStarted || isInactive;

  if (campaign.ends_at && new Date(campaign.ends_at) < now) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full p-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
            <p className="text-gray-600">
              This campaign has ended. Thank you for your interest.
            </p>
            {campaign.contact_email && (
              <p className="text-gray-600 text-sm mt-4">
                {campaign.contact_text || 'If you have any questions, please email'}{' '}
                <a href={`mailto:${campaign.contact_email}`} className="text-blue-600 hover:text-blue-700 underline">
                  {campaign.contact_email}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Get current claim count for scarcity
  let claimCount = 0;
  if (campaign.show_scarcity) {
    // In test mode, count test claims. In production, exclude them.
    const query = supabaseAdmin
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .eq('status', 'confirmed');

    // Only exclude test claims if campaign is NOT in test mode
    if (!campaign.test_mode) {
      query.eq('is_test_claim', false);
    }

    const { count } = await query;
    claimCount = count || 0;
  }

  // Fetch custom questions
  const { data: questions } = await supabaseAdmin
    .from('campaign_questions')
    .select('*')
    .eq('campaign_id', campaign.id)
    .order('display_order', { ascending: true });

  // Check if capacity is full (only if capacity is set)
  const isFull = campaign.capacity_total && claimCount >= campaign.capacity_total;

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
            {campaign.contact_email && (
              <p className="text-gray-600 text-sm mt-4">
                {campaign.contact_text || 'If you have any questions, please email'}{' '}
                <a
                  href={`mailto:${campaign.contact_email}`}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  {campaign.contact_email}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 md:p-10">
          {campaign.show_logo && (
            <div className="mb-6 flex justify-center">
              <img src="/cognitive-kin-logo.svg" alt="Cognitive Kin" className="h-12 w-auto" />
            </div>
          )}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">{campaign.title}</h1>
            {campaign.description && (
              <div className="text-gray-700 mb-6 prose prose-base sm:prose-lg max-w-none">
                <ReactMarkdown>{campaign.description}</ReactMarkdown>
              </div>
            )}

            {submissionsDisabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
                <p className="text-amber-900 font-semibold text-base">
                  {notYetStarted
                    ? `This campaign starts on ${new Date(campaign.starts_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: 'America/New_York',
                        timeZoneName: 'short'
                      })}`
                    : 'Submissions are not yet open for this campaign.'
                  }
                </p>
                <p className="text-amber-800 text-sm mt-1">
                  You can preview the form below, but submissions are not yet open.
                </p>
              </div>
            )}

            {campaign.ends_at && !submissionsDisabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
                <p className="text-amber-900 font-semibold text-base">
                  Deadline: {new Date(campaign.ends_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: 'America/New_York',
                    timeZoneName: 'short'
                  })}
                </p>
              </div>
            )}

            {campaign.show_scarcity && campaign.capacity_total > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
                <p className="text-blue-900 font-semibold text-base">
                  {campaign.capacity_total - claimCount} of {campaign.capacity_total} spots remaining
                </p>
              </div>
            )}

            {campaign.show_banner && campaign.banner_url && (
              <BannerPreview url={campaign.banner_url} />
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <h3 className="text-green-900 font-bold text-lg mb-2">Privacy Promise</h3>
              <p className="text-green-800 text-base font-medium">
                {campaign.privacy_blurb ||
                  "We only use your address to ship the book. We won't sell your information."}
              </p>
            </div>

            {campaign.contact_email && (
              <p className="text-gray-700 text-base mt-4">
                {campaign.contact_text || 'If you have any questions, please email'}{' '}
                <a
                  href={`mailto:${campaign.contact_email}`}
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  {campaign.contact_email}
                </a>
              </p>
            )}
          </div>

          <CampaignForm campaign={campaign} questions={questions || []} notYetStarted={submissionsDisabled} />
        </div>
      </div>
    </div>
  );
}
