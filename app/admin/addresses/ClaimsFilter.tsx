'use client';

import { useState } from 'react';

interface Claim {
  id: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  address1: string;
  address2: string | null;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  claim_token: string | null;
  is_test_claim: boolean;
  shipped_at: string | null;
  created_at: string;
  campaigns: {
    slug: string;
    title: string;
  } | null;
}

interface Props {
  claims: Claim[];
}

export default function ClaimsFilter({ claims }: Props) {
  const [showTest, setShowTest] = useState(false); // Default: hide test claims
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shippedFilter, setShippedFilter] = useState<string>('all'); // all, shipped, not-shipped
  const [preCreatedFilter, setPreCreatedFilter] = useState<string>('all'); // all, pre-created, regular

  // Apply filters
  const filteredClaims = claims.filter(claim => {
    // Test filter
    if (!showTest && claim.is_test_claim) return false;

    // Status filter
    if (statusFilter === 'confirmed' && claim.status !== 'confirmed') return false;
    if (statusFilter === 'pending' && claim.status !== 'pending') return false;
    if (statusFilter === 'rejected' && claim.status !== 'rejected') return false;

    // Shipped filter
    if (shippedFilter === 'shipped' && !claim.shipped_at) return false;
    if (shippedFilter === 'not-shipped' && claim.shipped_at) return false;

    // Pre-created filter
    const isPreCreated = claim.claim_token && !claim.address1;
    if (preCreatedFilter === 'pre-created' && !isPreCreated) return false;
    if (preCreatedFilter === 'regular' && isPreCreated) return false;

    return true;
  });

  // Count stats
  const testCount = claims.filter(c => c.is_test_claim).length;

  const exportFilteredClaims = () => {
    // Create CSV content
    const headers = [
      'Campaign',
      'Status',
      'First Name',
      'Last Name',
      'Email',
      'Company',
      'Title',
      'Phone',
      'Address 1',
      'Address 2',
      'City',
      'State/Region',
      'Postal Code',
      'Country',
      'Created Date',
      'Sent Date',
      'Is Test',
      'Is Pre-Created'
    ];

    const rows = filteredClaims.map(claim => {
      const isPreCreated = claim.claim_token && !claim.address1;
      return [
        claim.campaigns?.title || '',
        claim.status,
        claim.first_name,
        claim.last_name,
        claim.email || '',
        claim.company || '',
        claim.title || '',
        claim.phone || '',
        claim.address1 || '',
        claim.address2 || '',
        claim.city || '',
        claim.region || '',
        claim.postal_code || '',
        claim.country || '',
        new Date(claim.created_at).toLocaleDateString(),
        claim.shipped_at ? new Date(claim.shipped_at).toLocaleDateString() : '',
        claim.is_test_claim ? 'Yes' : 'No',
        isPreCreated ? 'Yes' : 'No'
      ];
    });

    // Generate CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `filtered-addresses-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sent:</label>
          <select
            value={shippedFilter}
            onChange={(e) => setShippedFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="shipped">Sent Only</option>
            <option value="not-shipped">Not Sent</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Type:</label>
          <select
            value={preCreatedFilter}
            onChange={(e) => setPreCreatedFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="pre-created">Pre-Created Only</option>
            <option value="regular">Regular Only</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showTest}
            onChange={(e) => setShowTest(e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-gray-700">
            Show test claims ({testCount})
          </span>
        </label>

        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Showing {filteredClaims.length} of {claims.length} claims
          </span>
          <button
            onClick={exportFilteredClaims}
            disabled={filteredClaims.length === 0}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export Filtered ({filteredClaims.length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City, Region
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Postal
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClaims.map((claim) => {
              const isPreCreated = claim.claim_token && !claim.address1;
              return (
                <tr
                  key={claim.id}
                  className={`${isPreCreated ? 'bg-orange-50' : ''} ${claim.is_test_claim ? 'bg-purple-50' : ''}`}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div className="font-medium text-gray-900">{claim.campaigns?.title}</div>
                      <div className="text-gray-500 text-xs">/{claim.campaigns?.slug}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded inline-block w-fit ${
                          claim.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : claim.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : claim.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {claim.status}
                      </span>
                      {claim.is_test_claim && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800 inline-block w-fit">
                          TEST
                        </span>
                      )}
                      {isPreCreated && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800 inline-block w-fit">
                          PRE-CREATED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {claim.first_name} {claim.last_name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {claim.email || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 min-w-[250px]">
                    {isPreCreated ? (
                      <span className="text-gray-400 italic">Awaiting address...</span>
                    ) : (
                      <>
                        {claim.address1}
                        {claim.address2 && <><br />{claim.address2}</>}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isPreCreated ? '-' : `${claim.city}, ${claim.region}`}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isPreCreated ? '-' : claim.postal_code}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {!isPreCreated && claim.shipped_at && (
                      <span className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        ✓ Sent
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {!isPreCreated && claim.shipped_at && (
                      new Date(claim.shipped_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredClaims.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No claims match your filters.</p>
          </div>
        )}
      </div>
    </>
  );
}
