'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface InviteCode {
  id: string;
  code: string;
  max_uses: number | null;
  uses: number;
  is_active: boolean;
  created_at: string;
}

interface InviteCodesManagerProps {
  campaignId: string;
  inviteCodes: InviteCode[];
}

export default function InviteCodesManager({ campaignId, inviteCodes: initialCodes }: InviteCodesManagerProps) {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>(initialCodes);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; codeId: string }>({ isOpen: false, codeId: '' });

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/invite-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.toUpperCase(),
          max_uses: maxUses ? parseInt(maxUses) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invite code');
      }

      setInviteCodes([data.inviteCode, ...inviteCodes]);
      setNewCode('');
      setMaxUses('');
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (codeId: string, currentlyActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/invite-codes/${codeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentlyActive }),
      });

      if (!response.ok) throw new Error('Failed to update code');

      setInviteCodes(inviteCodes.map(code =>
        code.id === codeId ? { ...code, is_active: !currentlyActive } : code
      ));
    } catch (err) {
      setError('Failed to update code');
    }
  };

  const handleDelete = (codeId: string) => {
    setDeleteConfirm({ isOpen: true, codeId });
  };

  const confirmDeleteCode = async () => {
    const codeId = deleteConfirm.codeId;
    setDeleteConfirm({ isOpen: false, codeId: '' });

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/invite-codes/${codeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete code');

      setInviteCodes(inviteCodes.filter(code => code.id !== codeId));
    } catch (err) {
      setError('Failed to delete code');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Invite Codes</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
        >
          {showAddForm ? 'Cancel' : '+ Add Code'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddCode} className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="WELCOME2024"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Will be converted to uppercase</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Uses (optional)
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Leave empty for unlimited"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited uses</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Code'}
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Invite Code"
        message="Are you sure you want to delete this invite code? This action cannot be undone."
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDeleteCode}
        onCancel={() => setDeleteConfirm({ isOpen: false, codeId: '' })}
      />

      {inviteCodes.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No invite codes yet. Add one to get started!
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inviteCodes.map((code) => (
                <tr key={code.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono font-semibold text-gray-900">{code.code}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {code.uses} {code.max_uses ? `/ ${code.max_uses}` : '/ ∞'}
                    {code.max_uses && code.uses >= code.max_uses && (
                      <span className="ml-2 text-xs text-red-600">(Full)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        code.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {code.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(code.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleToggleActive(code.id, code.is_active)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      {code.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(code.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
