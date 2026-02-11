'use client';

import { useState } from 'react';

interface Campaign {
  id: string;
  title: string;
  internal_title: string;
  slug: string;
  is_active: boolean;
  is_favorited: boolean;
  test_mode: boolean;
  capacity_total: number | null;
  created_by: string | null;
  creatorName: string;
  creatorEmail: string | null;
  confirmedCount: number;
  pendingCount: number;
  notes: string | null;
}

interface Props {
  campaigns: Campaign[];
  currentUserEmail: string;
}

export default function CampaignsFilter({ campaigns: initialCampaigns, currentUserEmail }: Props) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [ownerFilter, setOwnerFilter] = useState<string>('all'); // all, mine, specific-email
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);

  // Get unique creators (using email for filter key)
  const creators = Array.from(new Set(
    campaigns
      .filter(c => c.creatorEmail)
      .map(c => ({ email: c.creatorEmail!, name: c.creatorName }))
  )).reduce((acc, creator) => {
    if (!acc.find(c => c.email === creator.email)) {
      acc.push(creator);
    }
    return acc;
  }, [] as Array<{ email: string; name: string }>);

  // Apply filter
  const filteredCampaigns = campaigns.filter(campaign => {
    if (ownerFilter === 'all') return true;
    if (ownerFilter === 'mine') return campaign.creatorEmail === currentUserEmail;
    return campaign.creatorEmail === ownerFilter;
  });

  // Sort filtered campaigns: favorited active first, then active, then favorited inactive, then inactive
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    // First by favorite + active
    const aScore = (a.is_favorited ? 2 : 0) + (a.is_active ? 1 : 0);
    const bScore = (b.is_favorited ? 2 : 0) + (b.is_active ? 1 : 0);
    return bScore - aScore;
  });

  async function toggleFavorite(campaignId: string) {
    setTogglingFavorite(campaignId);

    // Optimistic update
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, is_favorited: !c.is_favorited } : c
    ));

    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/favorite`, {
        method: 'POST',
      });

      if (!res.ok) {
        // Revert on error
        setCampaigns(prev => prev.map(c =>
          c.id === campaignId ? { ...c, is_favorited: !c.is_favorited } : c
        ));
      }
    } catch {
      // Revert on error
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, is_favorited: !c.is_favorited } : c
      ));
    } finally {
      setTogglingFavorite(null);
    }
  }

  return (
    <>
      {/* Filter Controls */}
      {creators.length > 0 && (
        <div className="mb-4 lg:mb-6 bg-white rounded-lg shadow p-3 lg:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="text-sm font-medium text-gray-700 shrink-0">Filter by creator:</label>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-2.5 focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="all">All Campaigns ({campaigns.length})</option>
              <option value="mine">My Campaigns ({campaigns.filter(c => c.creatorEmail === currentUserEmail).length})</option>
              {creators.map(creator => (
                <option key={creator.email} value={creator.email}>
                  {creator.name} ({campaigns.filter(c => c.creatorEmail === creator.email).length})
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700 font-medium sm:ml-auto">
              Showing {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Campaign Grid */}
      <div className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {sortedCampaigns.map((campaign) => {
          const capacityText = (campaign.capacity_total && campaign.capacity_total > 0)
            ? `${campaign.confirmedCount} / ${campaign.capacity_total}`
            : `${campaign.confirmedCount} / Unlimited`;

          return (
          <div key={campaign.id} className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 lg:p-6 ${campaign.is_favorited ? 'ring-2 ring-yellow-400' : ''}`}>
            <div className="mb-3 lg:mb-4">
              <div className="flex items-start gap-2 mb-2">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 flex-1 leading-tight">{campaign.internal_title}</h3>
                <button
                  onClick={() => toggleFavorite(campaign.id)}
                  disabled={togglingFavorite === campaign.id}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 touch-manipulation"
                  title={campaign.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {campaign.is_favorited ? (
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400 hover:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  )}
                </button>
                {campaign.notes && (
                  <div className="group relative">
                    <svg
                      className="w-5 h-5 text-blue-500 cursor-help"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="hidden group-hover:block absolute z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg -right-2 top-6">
                      <div className="font-semibold mb-1">Internal Notes:</div>
                      <div className="whitespace-pre-wrap">{campaign.notes}</div>
                      <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span
                  className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                    campaign.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {campaign.is_active ? 'Active' : 'Inactive'}
                </span>
                {campaign.test_mode && (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                    Test
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 font-medium truncate">/c/{campaign.slug}</p>
              <p className="text-sm text-gray-600 font-medium mt-1">
                Created by {campaign.creatorEmail
                  ? (campaign.creatorEmail === currentUserEmail ? 'you' : campaign.creatorName)
                  : 'Unknown'}
              </p>
            </div>

            <div className="mb-3 lg:mb-4">
              <p className="text-sm lg:text-base text-gray-700 font-semibold">
                Confirmed: <span className="font-bold text-gray-900">{capacityText}</span>
              </p>
            </div>

            {/* Mobile: Stack buttons, Desktop: Row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={`/admin/campaigns/${campaign.id}`}
                className="flex-1 text-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
              >
                View/Edit
              </a>
              <a
                href={`/admin/campaigns/${campaign.id}/gift`}
                className="flex-1 sm:flex-none text-center px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700"
                title="Gift a book"
              >
                Gift
              </a>
              <a
                href={`/c/${campaign.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none text-center px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200"
              >
                Preview
              </a>
            </div>
          </div>
          );
        })}
      </div>

      {filteredCampaigns.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No campaigns match your filter.</p>
        </div>
      )}
    </>
  );
}
