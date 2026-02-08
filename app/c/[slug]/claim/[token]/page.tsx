import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import ReactMarkdown from 'react-markdown';
import TokenClaimForm from './TokenClaimForm';
import BannerPreview from '../../BannerPreview';

interface PreClaimPageProps {
  params: Promise<{ slug: string; token: string }>;
}

export default async function PreClaimPage({ params }: PreClaimPageProps) {
  const { slug, token } = await params;

  // Fetch campaign by slug
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .single();

  if (campaignError || !campaign) {
    notFound();
  }

  // Fetch pre-created claim by token
  const { data: claim, error: claimError } = await supabaseAdmin
    .from('claims')
    .select('*')
    .eq('claim_token', token)
    .eq('campaign_id', campaign.id)
    .single();

  if (claimError || !claim) {
    notFound();
  }

  // If claim already has an address, show already submitted message
  if (claim.address1) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Submitted</h1>
            <p className="text-gray-600">
              This claim has already been completed. Thank you!
            </p>
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

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">{campaign.title}</h1>
          {campaign.description && (
            <div className="text-gray-700 mb-6 prose prose-base sm:prose-lg max-w-none">
              <ReactMarkdown>{campaign.description}</ReactMarkdown>
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-base">
              <strong>Note:</strong> This form has been pre-filled for you. Please review and update any information as needed before submitting.
            </p>
          </div>

          {campaign.show_banner && campaign.banner_url && (
            <div className="mb-6">
              <BannerPreview url={campaign.banner_url} />
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
            <h3 className="text-green-900 font-bold text-lg mb-2">Privacy Promise</h3>
            <p className="text-green-800 text-base font-medium">
              {campaign.privacy_blurb ||
                "We only use your address to ship the book. We won't sell your information."}
            </p>
          </div>

          {campaign.contact_email && (
            <p className="text-gray-700 text-base mb-6">
              {campaign.contact_text || 'If you have any questions, please email'}{' '}
              <a
                href={`mailto:${campaign.contact_email}`}
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                {campaign.contact_email}
              </a>
            </p>
          )}

          <TokenClaimForm
            campaign={campaign}
            prefilledData={claim}
            claimToken={token}
          />
        </div>
      </div>
    </div>
  );
}
