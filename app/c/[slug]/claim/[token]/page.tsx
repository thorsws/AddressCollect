import { notFound } from 'next/navigation';

interface PreClaimPageProps {
  params: Promise<{ slug: string; token: string }>;
}

export default async function PreClaimPage({ params }: PreClaimPageProps) {
  const { slug, token } = await params;

  // Fetch pre-created claim data
  const response = await fetch(
    `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/campaigns/${slug}/claim/${token}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    notFound();
  }

  const { campaign, claim } = await response.json();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Import the CampaignForm component and pass prefilled data */}
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

          {/* We'll import the existing CampaignForm and pass prefilled data */}
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

// Import the form component we'll create
import TokenClaimForm from './TokenClaimForm';
