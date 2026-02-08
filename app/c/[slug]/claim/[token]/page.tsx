import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
          {campaign.description && (
            <p className="text-gray-600 mb-6">{campaign.description}</p>
          )}

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This form has been pre-filled for you. Please review and update any information as needed before submitting.
            </p>
          </div>

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

import TokenClaimForm from './TokenClaimForm';
