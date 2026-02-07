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

  // Show message if campaign is inactive
  if (!campaign.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full p-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
            <p className="text-lg text-gray-600 mb-2">
              This campaign is currently unavailable.
            </p>
            <p className="text-sm text-gray-500">
              Please check back later or contact us for more information.
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

  // Check if campaign is within date window
  const now = new Date();
  if (campaign.starts_at && new Date(campaign.starts_at) > now) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full p-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
            <p className="text-gray-600">
              This campaign has not started yet. Please check back later.
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {campaign.show_logo && (
            <div className="mb-6 flex justify-center">
              <img src="/cognitive-kin-logo.svg" alt="Cognitive Kin" className="h-10 w-auto" />
            </div>
          )}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
            {campaign.description && (
              <div className="text-gray-600 mb-6 prose prose-sm max-w-none">
                <ReactMarkdown>{campaign.description}</ReactMarkdown>
              </div>
            )}

            {campaign.ends_at && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-900 font-medium">
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

            {campaign.show_scarcity && campaign.capacity_total && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-900 font-medium">
                  {campaign.capacity_total - claimCount} of {campaign.capacity_total} spots remaining
                </p>
              </div>
            )}

            {campaign.show_banner && campaign.banner_url && (
              <BannerPreview url={campaign.banner_url} />
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-900 font-semibold mb-2">Privacy Promise</h3>
              <p className="text-green-800 text-sm">
                {campaign.privacy_blurb ||
                  "We only use your address to ship the book. We won't sell your information."}
              </p>
            </div>

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

          <CampaignForm campaign={campaign} questions={questions || []} />
        </div>
      </div>
    </div>
  );
}
