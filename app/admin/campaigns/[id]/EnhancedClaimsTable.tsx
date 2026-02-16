'use client';

import { useState, Fragment } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';

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
  claim_token: string | null;
  shipped_at: string | null;
  admin_notes: string | null;
  pre_created_by: string | null;
}

interface EnhancedClaimsTableProps {
  claims: Claim[];
  capacity_total: number | null;
  campaignSlug: string;
  userRole?: string;
}

export default function EnhancedClaimsTable({ claims, capacity_total, campaignSlug, userRole }: EnhancedClaimsTableProps) {
  const [showTestClaims, setShowTestClaims] = useState(true);
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<{[key: string]: string}>({});
  const [editingPreCreated, setEditingPreCreated] = useState<{[key: string]: {
    first_name: string;
    last_name: string;
    email: string;
    company?: string;
    title?: string;
    phone?: string;
  }}>({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{ isOpen: boolean; claimId: string; newStatus: string; message: string }>({ isOpen: false, claimId: '', newStatus: '', message: '' });
  const [deleteClaimConfirm, setDeleteClaimConfirm] = useState<{ isOpen: boolean; claimId: string; claimName: string }>({ isOpen: false, claimId: '', claimName: '' });

  const isSuperAdmin = userRole === 'super_admin';

  // Calculate stats
  const testClaims = claims.filter(c => c.is_test_claim);
  const realClaims = claims.filter(c => !c.is_test_claim);
  const confirmedRealClaims = realClaims.filter(c => c.status === 'confirmed');
  const pendingRealClaims = realClaims.filter(c => c.status === 'pending');
  const rejectedClaims = claims.filter(c => c.status === 'rejected');
  const shippedClaims = claims.filter(c => c.shipped_at);
  const preCreatedClaims = claims.filter(c => c.claim_token && !c.address1); // Pre-created but not submitted

  // Filter claims based on toggle
  const filteredClaims = showTestClaims ? claims : realClaims;

  const toggleShipped = async (claimId: string, currentlyShipped: boolean) => {
    try {
      const response = await fetch(`/api/admin/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipped_at: !currentlyShipped }),
      });

      if (response.ok) {
        window.location.reload(); // Simple reload for now
      }
    } catch (error) {
      console.error('Failed to update shipped status:', error);
    }
  };

  const saveNotes = async (claimId: string) => {
    try {
      const response = await fetch(`/api/admin/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: editingNotes[claimId] || '' }),
      });

      if (response.ok) {
        delete editingNotes[claimId];
        setEditingNotes({...editingNotes});
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  const changeStatus = (claimId: string, newStatus: string) => {
    const message = newStatus === 'rejected'
      ? 'Reject this claim? It won\'t count toward capacity.'
      : `Change status to "${newStatus}"?`;

    setStatusConfirm({ isOpen: true, claimId, newStatus, message });
  };

  const confirmStatusChange = async () => {
    const { claimId, newStatus } = statusConfirm;
    setStatusConfirm({ isOpen: false, claimId: '', newStatus: '', message: '' });

    try {
      const response = await fetch(`/api/admin/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const deleteClaim = (claimId: string, claimName: string) => {
    setDeleteClaimConfirm({ isOpen: true, claimId, claimName });
  };

  const confirmDeleteClaim = async () => {
    const { claimId } = deleteClaimConfirm;
    setDeleteClaimConfirm({ isOpen: false, claimId: '', claimName: '' });

    setDeleting(claimId);
    try {
      const response = await fetch(`/api/admin/claims/${claimId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete claim');
      }
    } catch (error) {
      console.error('Failed to delete claim:', error);
      alert('Failed to delete claim');
    } finally {
      setDeleting(null);
    }
  };

  const copyClaimUrl = (token: string) => {
    const url = `${window.location.origin}/c/${campaignSlug}/claim/${token}`;
    navigator.clipboard.writeText(url);
    alert('Claim URL copied to clipboard!');
  };

  const savePreCreatedInfo = async (claimId: string) => {
    const editData = editingPreCreated[claimId];
    if (!editData) return;

    setSaving(claimId);
    try {
      const response = await fetch(`/api/admin/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: editData.first_name,
          last_name: editData.last_name,
          email: editData.email || null,
          company: editData.company || null,
          title: editData.title || null,
          phone: editData.phone || null,
        }),
      });

      if (response.ok) {
        delete editingPreCreated[claimId];
        setEditingPreCreated({...editingPreCreated});
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Failed to save pre-created info:', error);
      alert('Failed to save');
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <ConfirmDialog
        isOpen={statusConfirm.isOpen}
        title="Change Claim Status"
        message={statusConfirm.message}
        confirmText="Confirm"
        confirmButtonClass={statusConfirm.newStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusConfirm({ isOpen: false, claimId: '', newStatus: '', message: '' })}
      />

      <ConfirmDialog
        isOpen={deleteClaimConfirm.isOpen}
        title="Delete Claim"
        message={`Are you sure you want to permanently delete this claim for "${deleteClaimConfirm.claimName}"? This cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDeleteClaim}
        onCancel={() => setDeleteClaimConfirm({ isOpen: false, claimId: '', claimName: '' })}
      />

      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
          </div>
          <div>
            <p className="text-sm text-gray-600">Sent</p>
            <p className="text-2xl font-bold text-blue-600">{shippedClaims.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pre-Created</p>
            <p className="text-2xl font-bold text-orange-600">{preCreatedClaims.length}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting submission</p>
          </div>
          {rejectedClaims.length > 0 && (
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{rejectedClaims.length}</p>
              <p className="text-xs text-gray-500 mt-1">Invalid/removed</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Verified Email (Real)</p>
            <p className="text-2xl font-bold text-green-600">{confirmedRealClaims.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Capacity</p>
            <p className="text-2xl font-bold text-gray-900">
              {confirmedRealClaims.length}{capacity_total ? ` / ${capacity_total}` : ' (Unlimited)'}
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
                  Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No claims yet
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const isPreCreated = claim.claim_token && !claim.address1;
                  const isExpanded = expandedClaimId === claim.id;

                  return (
                    <Fragment key={claim.id}>
                      <tr className={isPreCreated ? 'bg-orange-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded ${
                                  claim.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : claim.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : claim.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
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
                            {isPreCreated && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800">
                                PRE-CREATED
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
                          {isPreCreated ? (
                            <span className="text-gray-400 italic">No address yet</span>
                          ) : (
                            <>
                              {claim.address1}
                              {claim.address2 && <><br />{claim.address2}</>}
                              <br />
                              {claim.city}, {claim.region} {claim.postal_code}
                              <br />
                              {claim.country}
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {!isPreCreated && claim.shipped_at && (
                            <span className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                              ✓ Sent
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {!isPreCreated && claim.shipped_at && (
                            new Date(claim.shipped_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setExpandedClaimId(isExpanded ? null : claim.id)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            {isExpanded ? 'Hide' : 'Details'}
                          </button>
                          {!isPreCreated && !claim.shipped_at && (
                            <button
                              onClick={() => toggleShipped(claim.id, false)}
                              className="text-green-600 hover:text-green-800 mr-2"
                            >
                              Mark Sent
                            </button>
                          )}
                          {!isPreCreated && claim.shipped_at && (
                            <button
                              onClick={() => toggleShipped(claim.id, true)}
                              className="text-gray-600 hover:text-gray-800 mr-2"
                            >
                              Unmark
                            </button>
                          )}
                          {isPreCreated && (
                            <button
                              onClick={() => copyClaimUrl(claim.claim_token!)}
                              className="text-green-600 hover:text-green-800"
                            >
                              Copy URL
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded row for details */}
                      {isExpanded && (
                        <tr key={`${claim.id}-details`}>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                                <p className="text-sm text-gray-900">{new Date(claim.created_at).toLocaleString()}</p>
                              </div>

                              {claim.shipped_at && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase">Sent</p>
                                  <p className="text-sm text-gray-900">{new Date(claim.shipped_at).toLocaleString()}</p>
                                </div>
                              )}

                              {isPreCreated && claim.claim_token && (
                                <>
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Claim URL</p>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="text"
                                        readOnly
                                        value={`${window.location.origin}/c/${campaignSlug}/claim/${claim.claim_token}`}
                                        className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded bg-white"
                                      />
                                      <button
                                        onClick={() => copyClaimUrl(claim.claim_token!)}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                      >
                                        Copy
                                      </button>
                                    </div>
                                  </div>

                                  {/* Edit Pre-Created Info */}
                                  <div className="pt-3 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Edit Pre-filled Info</p>
                                    {editingPreCreated[claim.id] ? (
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">First Name</label>
                                            <input
                                              type="text"
                                              value={editingPreCreated[claim.id].first_name}
                                              onChange={(e) => setEditingPreCreated({
                                                ...editingPreCreated,
                                                [claim.id]: {...editingPreCreated[claim.id], first_name: e.target.value}
                                              })}
                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">Last Name</label>
                                            <input
                                              type="text"
                                              value={editingPreCreated[claim.id].last_name}
                                              onChange={(e) => setEditingPreCreated({
                                                ...editingPreCreated,
                                                [claim.id]: {...editingPreCreated[claim.id], last_name: e.target.value}
                                              })}
                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-xs text-gray-600 mb-1">Email</label>
                                          <input
                                            type="email"
                                            value={editingPreCreated[claim.id].email || ''}
                                            onChange={(e) => setEditingPreCreated({
                                              ...editingPreCreated,
                                              [claim.id]: {...editingPreCreated[claim.id], email: e.target.value}
                                            })}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                          />
                                        </div>
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => savePreCreatedInfo(claim.id)}
                                            disabled={saving === claim.id}
                                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                                          >
                                            {saving === claim.id ? 'Saving...' : 'Save'}
                                          </button>
                                          <button
                                            onClick={() => {
                                              delete editingPreCreated[claim.id];
                                              setEditingPreCreated({...editingPreCreated});
                                            }}
                                            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setEditingPreCreated({
                                          ...editingPreCreated,
                                          [claim.id]: {
                                            first_name: claim.first_name || '',
                                            last_name: claim.last_name || '',
                                            email: claim.email || '',
                                          }
                                        })}
                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                      >
                                        Edit Info
                                      </button>
                                    )}
                                  </div>

                                  {/* Delete Pre-Created Claim */}
                                  <div className="pt-3 border-t border-gray-200">
                                    <button
                                      onClick={() => deleteClaim(claim.id, `${claim.first_name} ${claim.last_name}`.trim() || 'this pre-created claim')}
                                      disabled={deleting === claim.id}
                                      className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 disabled:opacity-50"
                                    >
                                      {deleting === claim.id ? 'Deleting...' : 'Delete Pre-Created Claim'}
                                    </button>
                                  </div>
                                </>
                              )}

                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Admin Notes (Private)</p>
                                {editingNotes[claim.id] !== undefined ? (
                                  <div>
                                    <textarea
                                      value={editingNotes[claim.id]}
                                      onChange={(e) => setEditingNotes({...editingNotes, [claim.id]: e.target.value})}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                      rows={3}
                                      placeholder="Add private notes..."
                                    />
                                    <div className="mt-2 flex space-x-2">
                                      <button
                                        onClick={() => saveNotes(claim.id)}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => {
                                          delete editingNotes[claim.id];
                                          setEditingNotes({...editingNotes});
                                        }}
                                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                      {claim.admin_notes || <span className="text-gray-400 italic">No notes</span>}
                                    </p>
                                    <button
                                      onClick={() => setEditingNotes({...editingNotes, [claim.id]: claim.admin_notes || ''})}
                                      className="mt-2 text-blue-600 hover:text-blue-800 text-xs"
                                    >
                                      Edit Notes
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Status Change Actions */}
                              <div className="pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Change Status</p>
                                <div className="flex flex-wrap gap-2">
                                  {claim.status !== 'confirmed' && (
                                    <button
                                      onClick={() => changeStatus(claim.id, 'confirmed')}
                                      className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200"
                                    >
                                      Mark Verified
                                    </button>
                                  )}
                                  {claim.status !== 'pending' && (
                                    <button
                                      onClick={() => changeStatus(claim.id, 'pending')}
                                      className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded hover:bg-yellow-200"
                                    >
                                      Mark Pending
                                    </button>
                                  )}
                                  {claim.status !== 'rejected' && (
                                    <button
                                      onClick={() => changeStatus(claim.id, 'rejected')}
                                      className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded hover:bg-red-200"
                                    >
                                      Reject (Invalid)
                                    </button>
                                  )}
                                </div>
                                {claim.status === 'rejected' && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Rejected claims don&apos;t count toward capacity
                                  </p>
                                )}

                                {/* Delete button - super_admin only */}
                                {isSuperAdmin && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <button
                                      onClick={() => deleteClaim(claim.id, `${claim.first_name} ${claim.last_name}`)}
                                      disabled={deleting === claim.id}
                                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                                    >
                                      {deleting === claim.id ? 'Deleting...' : 'Delete Permanently'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
