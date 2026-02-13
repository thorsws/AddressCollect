'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import { stripHtml } from '@/lib/utils/stripHtml';

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
  userRole: 'super_admin' | 'admin' | 'viewer';
}

export default function ClaimsFilter({ claims: initialClaims, userRole }: Props) {
  const router = useRouter();
  const [claims, setClaims] = useState(initialClaims);
  const [showTest, setShowTest] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shippedFilter, setShippedFilter] = useState<string>('all');
  const [preCreatedFilter, setPreCreatedFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkSentDate, setBulkSentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonClass?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Apply filters
  const filteredClaims = claims.filter(claim => {
    if (!showTest && claim.is_test_claim) return false;
    if (statusFilter === 'confirmed' && claim.status !== 'confirmed') return false;
    if (statusFilter === 'pending' && claim.status !== 'pending') return false;
    if (statusFilter === 'rejected' && claim.status !== 'rejected') return false;
    if (shippedFilter === 'shipped' && !claim.shipped_at) return false;
    if (shippedFilter === 'not-shipped' && claim.shipped_at) return false;

    const isPreCreated = claim.claim_token && !claim.address1;
    if (preCreatedFilter === 'pre-created' && !isPreCreated) return false;
    if (preCreatedFilter === 'regular' && isPreCreated) return false;

    if (dateFilter) {
      if (!claim.shipped_at) return false;
      const sentDate = new Date(claim.shipped_at).toISOString().split('T')[0];
      if (sentDate !== dateFilter) return false;
    }

    return true;
  });

  const testCount = claims.filter(c => c.is_test_claim).length;

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredClaims.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClaims.map(c => c.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Actual bulk update function
  const performBulkUpdate = async () => {
    setBulkUpdating(true);
    try {
      const sentDateTime = new Date(bulkSentDate + 'T12:00:00').toISOString();

      const response = await fetch('/api/admin/claims/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimIds: Array.from(selectedIds),
          shipped_at: sentDateTime,
        }),
      });

      if (response.ok) {
        setClaims(claims.map(c =>
          selectedIds.has(c.id) ? { ...c, shipped_at: sentDateTime } : c
        ));
        setSelectedIds(new Set());
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update claims');
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      alert('Failed to update claims');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Show confirmation dialog before bulk update
  const bulkMarkAsSent = () => {
    if (selectedIds.size === 0) return;
    if (!bulkSentDate) {
      alert('Please select a date');
      return;
    }

    const formattedDate = new Date(bulkSentDate + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    setConfirmDialog({
      isOpen: true,
      title: 'Set Sent Date',
      message: `Mark ${selectedIds.size} claim${selectedIds.size > 1 ? 's' : ''} as sent on ${formattedDate}?`,
      confirmText: 'Set Sent Date',
      confirmButtonClass: 'bg-blue-600 hover:bg-blue-700',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        performBulkUpdate();
      },
    });
  };

  // Actual bulk delete function
  const performBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const response = await fetch('/api/admin/claims/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimIds: Array.from(selectedIds),
        }),
      });

      if (response.ok) {
        setClaims(claims.filter(c => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
        // Refresh to update the stats at the top of the page
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete claims');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete claims');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Show confirmation dialog before bulk delete
  const bulkDelete = () => {
    if (selectedIds.size === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Claims',
      message: `Are you sure you want to permanently delete ${selectedIds.size} claim${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        performBulkDelete();
      },
    });
  };

  const exportFilteredClaims = () => {
    const headers = [
      'Campaign', 'Status', 'First Name', 'Last Name', 'Email', 'Company',
      'Title', 'Phone', 'Address 1', 'Address 2', 'City', 'State/Region',
      'Postal Code', 'Country', 'Created Date', 'Sent Date', 'Is Test', 'Is Pre-Created'
    ];

    const rows = filteredClaims.map(claim => {
      const isPreCreated = claim.claim_token && !claim.address1;
      return [
        stripHtml(claim.campaigns?.title) || '', claim.status, claim.first_name, claim.last_name,
        claim.email || '', claim.company || '', claim.title || '', claim.phone || '',
        claim.address1 || '', claim.address2 || '', claim.city || '', claim.region || '',
        claim.postal_code || '', claim.country || '',
        new Date(claim.created_at).toLocaleDateString(),
        claim.shipped_at ? new Date(claim.shipped_at).toLocaleDateString() : '',
        claim.is_test_claim ? 'Yes' : 'No', isPreCreated ? 'Yes' : 'No'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => {
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `filtered-addresses-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const sentDates = Array.from(new Set(
    claims
      .filter(c => c.shipped_at)
      .map(c => new Date(c.shipped_at!).toISOString().split('T')[0])
  )).sort().reverse();

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmButtonClass={confirmDialog.confirmButtonClass}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

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
          <label className="text-sm font-medium text-gray-700">Sent Date:</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Dates</option>
            {sentDates.map(date => (
              <option key={date} value={date}>
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </option>
            ))}
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
          <span className="text-gray-700">Show test claims ({testCount})</span>
        </label>

        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Showing {filteredClaims.length} of {claims.length} claims
          </span>
          <button
            onClick={exportFilteredClaims}
            disabled={filteredClaims.length === 0}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50"
          >
            Export Filtered ({filteredClaims.length})
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-4">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Sent date:</label>
            <input
              type="date"
              value={bulkSentDate}
              onChange={(e) => setBulkSentDate(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={bulkMarkAsSent}
            disabled={bulkUpdating || !bulkSentDate}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {bulkUpdating ? 'Updating...' : 'Set Sent Date'}
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1 text-blue-600 text-sm hover:text-blue-800"
          >
            Clear Selection
          </button>
          {userRole === 'super_admin' && (
            <button
              onClick={bulkDelete}
              disabled={bulkDeleting}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 ml-2"
            >
              {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredClaims.length && filteredClaims.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
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
                Campaign
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClaims.map((claim) => {
              const isPreCreated = claim.claim_token && !claim.address1;
              const isSelected = selectedIds.has(claim.id);
              return (
                <tr
                  key={claim.id}
                  className={`${isPreCreated ? 'bg-orange-50' : ''} ${claim.is_test_claim ? 'bg-purple-50' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(claim.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {!isPreCreated && claim.shipped_at ? (
                      <span className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        Sent
                      </span>
                    ) : !isPreCreated ? (
                      <span className="text-gray-400 text-xs">-</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {!isPreCreated && claim.shipped_at ? (
                      new Date(claim.shipped_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })
                    ) : null}
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
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div className="font-medium text-gray-900">{stripHtml(claim.campaigns?.title)}</div>
                      <div className="text-gray-500 text-xs">/{claim.campaigns?.slug}</div>
                    </div>
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
