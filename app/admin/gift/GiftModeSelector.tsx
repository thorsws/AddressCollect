'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { stripHtml } from '@/lib/utils/stripHtml';

interface Campaign {
  id: string;
  slug: string;
  title: string;
  internal_title: string | null;
  is_active: boolean;
}

interface Props {
  campaigns: Campaign[];
  gifterName: string;
  hasProfile: boolean;
}

export default function GiftModeSelector({ campaigns, gifterName, hasProfile }: Props) {
  const router = useRouter();
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');

  function handleStartGifting() {
    if (selectedCampaign) {
      router.push(`/admin/campaigns/${selectedCampaign}/gift`);
    }
  }

  if (campaigns.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">No Active Campaigns</h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have any active campaigns to gift from.
          </p>
          <Link
            href="/admin"
            className="text-blue-600 hover:underline"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Gift Mode</h1>
          <Link
            href="/admin/settings"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Profile
          </Link>
        </div>
        {!hasProfile && (
          <p className="text-sm text-amber-700 mt-2">
            Set up your <Link href="/admin/settings" className="underline">profile</Link> to include your name and LinkedIn.
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 mb-4 text-center">
              Gifting as <strong>{gifterName}</strong>
            </p>

            <div className="mb-6">
              <label htmlFor="campaign" className="block text-sm font-medium text-gray-700 mb-2">
                Select Campaign
              </label>
              <select
                id="campaign"
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Choose a campaign...</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.internal_title || stripHtml(campaign.title)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStartGifting}
              disabled={!selectedCampaign}
              className="w-full py-4 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              Start Gifting
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
