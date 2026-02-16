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
  registeredCount: number;
  pendingCount: number;
  notes: string | null;
  show_in_leaderboard: boolean;
  is_hidden: boolean;
}

interface Props {
  campaigns: Campaign[];
  currentUserEmail: string;
  isSuperAdmin?: boolean;
}

export default function CampaignsFilter({ campaigns: initialCampaigns, currentUserEmail, isSuperAdmin }: Props) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [ownerFilter, setOwnerFilter] = useState<string>('all'); // all, mine, specific-email
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);
  const [togglingLeaderboard, setTogglingLeaderboard] = useState<string | null>(null);
  const [togglingHidden, setTogglingHidden] = useState<string | null>(null);

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

  // Filter out hidden campaigns for non-super admins
  const visibleCampaigns = isSuperAdmin
    ? campaigns
    : campaigns.filter(c => !c.is_hidden);

  // Apply filter (on visible campaigns only)
  const filteredCampaigns = visibleCampaigns.filter(campaign => {
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

  async function toggleLeaderboard(campaignId: string) {
    setTogglingLeaderboard(campaignId);

    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, show_in_leaderboard: !c.show_in_leaderboard } : c
    ));

    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/leaderboard`, {
        method: 'POST',
      });

      if (!res.ok) {
        setCampaigns(prev => prev.map(c =>
          c.id === campaignId ? { ...c, show_in_leaderboard: !c.show_in_leaderboard } : c
        ));
      }
    } catch {
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, show_in_leaderboard: !c.show_in_leaderboard } : c
      ));
    } finally {
      setTogglingLeaderboard(null);
    }
  }

  async function toggleHidden(campaignId: string) {
    setTogglingHidden(campaignId);

    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, is_hidden: !c.is_hidden } : c
    ));

    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/hide`, {
        method: 'POST',
      });

      if (!res.ok) {
        setCampaigns(prev => prev.map(c =>
          c.id === campaignId ? { ...c, is_hidden: !c.is_hidden } : c
        ));
      }
    } catch {
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, is_hidden: !c.is_hidden } : c
      ));
    } finally {
      setTogglingHidden(null);
    }
  }

  // Leaderboard: active, not hidden, show_in_leaderboard
  const leaderboard = campaigns
    .filter(c => c.is_active && c.show_in_leaderboard && !c.is_hidden)
    .sort((a, b) => b.registeredCount - a.registeredCount)
    .slice(0, 3);
  const maxCount = leaderboard[0]?.registeredCount || 1;

  return (
    <>
      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Leaderboard</h3>
            <a
              href="/admin/leaderboard"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View Full Leaderboard →
            </a>
          </div>
          <div className="space-y-3">
            {leaderboard.map((campaign, index) => {
              const barWidth = maxCount > 0 ? Math.max((campaign.registeredCount / maxCount) * 100, 2) : 2;
              return (
                <div key={campaign.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-6 text-right shrink-0">
                    {index + 1}
                  </span>
                  <a
                    href={`/admin/campaigns/${campaign.id}`}
                    className="text-sm font-medium text-gray-900 w-40 lg:w-56 truncate shrink-0 hover:text-blue-600"
                    title={campaign.internal_title}
                  >
                    {campaign.internal_title}
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-16 text-right shrink-0">
                    {campaign.registeredCount}
                    {campaign.capacity_total && campaign.capacity_total > 0
                      ? <span className="text-gray-400 font-normal"> / {campaign.capacity_total}</span>
                      : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              <option value="all">All Campaigns ({visibleCampaigns.length})</option>
              <option value="mine">My Campaigns ({visibleCampaigns.filter(c => c.creatorEmail === currentUserEmail).length})</option>
              {creators.map(creator => (
                <option key={creator.email} value={creator.email}>
                  {creator.name} ({visibleCampaigns.filter(c => c.creatorEmail === creator.email).length})
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
            ? `${campaign.registeredCount} / ${campaign.capacity_total}`
            : `${campaign.registeredCount}`;

          return (
          <div key={campaign.id} className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 lg:p-6 ${campaign.is_favorited ? 'ring-2 ring-yellow-400' : ''} ${campaign.is_hidden ? 'opacity-60' : ''}`}>
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
                {isSuperAdmin && (
                  <>
                    <button
                      onClick={() => toggleLeaderboard(campaign.id)}
                      disabled={togglingLeaderboard === campaign.id}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 touch-manipulation"
                      title={campaign.show_in_leaderboard ? 'Hide from leaderboard' : 'Show in leaderboard'}
                    >
                      <svg className={`w-5 h-5 ${campaign.show_in_leaderboard ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleHidden(campaign.id)}
                      disabled={togglingHidden === campaign.id}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 touch-manipulation"
                      title={campaign.is_hidden ? 'Unhide campaign (visible to all)' : 'Hide campaign (only you can see)'}
                    >
                      {campaign.is_hidden ? (
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </>
                )}
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
                {campaign.is_hidden && (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    Hidden
                  </span>
                )}
                {campaign.show_in_leaderboard && (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                    Leaderboard
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
                Registered: <span className="font-bold text-gray-900">{capacityText}</span>
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
