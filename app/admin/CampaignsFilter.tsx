'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Campaign {
  id: string;
  title: string;
  internal_title: string;
  slug: string;
  is_active: boolean;
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

export default function CampaignsFilter({ campaigns, currentUserEmail }: Props) {
  const [ownerFilter, setOwnerFilter] = useState<string>('all'); // all, mine, specific-email

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

  return (
    <>
      {/* Filter Controls */}
      {creators.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by creator:</label>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Campaigns ({campaigns.length})</option>
              <option value="mine">My Campaigns ({campaigns.filter(c => c.creatorEmail === currentUserEmail).length})</option>
              {creators.map(creator => (
                <option key={creator.email} value={creator.email}>
                  {creator.name} ({campaigns.filter(c => c.creatorEmail === creator.email).length})
                </option>
              ))}
            </select>
            <span className="ml-auto text-sm text-gray-700 font-medium">
              Showing {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Campaign Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCampaigns.map((campaign) => {
          const capacityText = (campaign.capacity_total && campaign.capacity_total > 0)
            ? `${campaign.confirmedCount} / ${campaign.capacity_total}`
            : `${campaign.confirmedCount} / Unlimited`;

          return (
          <div key={campaign.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
            <div className="mb-4">
              <div className="flex items-start gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">{campaign.internal_title}</h3>
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
              <div className="flex gap-1.5 mb-2">
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
              <p className="text-sm text-gray-700 font-medium">/c/{campaign.slug}</p>
              <p className="text-sm text-gray-600 font-medium mt-1.5">
                Created by {campaign.creatorEmail
                  ? (campaign.creatorEmail === currentUserEmail ? 'you' : campaign.creatorName)
                  : 'Unknown'}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-base text-gray-700 font-semibold">
                Confirmed: <span className="font-bold text-gray-900">{capacityText}</span>
              </p>
            </div>

            <div className="flex space-x-2">
              <a
                href={`/admin/campaigns/${campaign.id}`}
                className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
              >
                View/Edit Campaign
              </a>
              <a
                href={`/c/${campaign.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200"
              >
                View Page
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
