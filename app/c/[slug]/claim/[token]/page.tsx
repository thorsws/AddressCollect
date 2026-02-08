import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import TokenClaimFormWrapper from './TokenClaimFormWrapper';

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
            {campaign.show_logo && (
              <div className="mb-6 flex justify-center">
                <img src="/cognitive-kin-logo.svg" alt="Cognitive Kin" className="h-12 w-auto" />
              </div>
            )}
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

  // Prepare page content data for the wrapper
  const pageContent = {
    showLogo: campaign.show_logo,
    title: campaign.title,
    description: campaign.description,
    showBanner: campaign.show_banner && campaign.banner_url,
    bannerUrl: campaign.banner_url,
    privacyBlurb: campaign.privacy_blurb,
    contactEmail: campaign.contact_email,
    contactText: campaign.contact_text,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <TokenClaimFormWrapper
          campaign={campaign}
          prefilledData={claim}
          claimToken={token}
          pageContent={pageContent}
        />
      </div>
    </div>
  );
}
