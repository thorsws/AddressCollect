'use client';

import { useState } from 'react';

interface Claim {
  id: string;
  status: string;
  is_test_claim: boolean;
  first_name: string;
  last_name: string;
  email: string | null;
  address1: string;
  address2: string | null;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  created_at: string;
}

interface ClaimsTableProps {
  claims: Claim[];
  capacity_total: number;
}

export default function ClaimsTable({ claims, capacity_total }: ClaimsTableProps) {
  const [showTestClaims, setShowTestClaims] = useState(true);

  // Calculate stats
  const testClaims = claims.filter(c => c.is_test_claim);
  const realClaims = claims.filter(c => !c.is_test_claim);
  const confirmedRealClaims = realClaims.filter(c => c.status === 'confirmed');
  const pendingRealClaims = realClaims.filter(c => c.status === 'pending');
  const confirmedTestClaims = testClaims.filter(c => c.status === 'confirmed');
  const pendingTestClaims = testClaims.filter(c => c.status === 'pending');

  // Filter claims based on toggle
  const filteredClaims = showTestClaims ? claims : realClaims;

  return (
    <>
      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-600">Real Claims</p>
            <p className="text-2xl font-bold text-gray-900">{realClaims.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              {confirmedRealClaims.length} verified, {pendingRealClaims.length} pending
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Test Claims</p>
            <p className="text-2xl font-bold text-purple-600">{testClaims.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              {confirmedTestClaims.length} verified, {pendingTestClaims.length} pending
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Claims</p>
            <p className="text-2xl font-bold text-gray-900">{claims.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Verified Email (Real)</p>
            <p className="text-2xl font-bold text-green-600">{confirmedRealClaims.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Capacity</p>
            <p className="text-2xl font-bold text-gray-900">
              {confirmedRealClaims.length} / {capacity_total}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Claims</h2>

          <div className="flex items-center space-x-4">
            {!showTestClaims && testClaims.length > 0 && (
              <span className="text-sm text-gray-500">
                Hiding {testClaims.length} test claim{testClaims.length !== 1 ? 's' : ''}
              </span>
            )}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showTestClaims}
                onChange={(e) => setShowTestClaims(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show test claims</span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City, Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Postal Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No claims yet
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            claim.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : claim.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {claim.status === 'confirmed' ? 'verified email' : claim.status}
                        </span>
                        {claim.is_test_claim && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                            TEST
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.first_name} {claim.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {claim.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {claim.address1}
                      {claim.address2 && <><br />{claim.address2}</>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {claim.city}, {claim.region}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {claim.postal_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {claim.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(claim.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
