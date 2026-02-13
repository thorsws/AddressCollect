'use client';

import { useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Member {
  id: string;
  role: 'owner' | 'editor' | 'viewer';
  created_at: string;
  user: {
    id: string;
    email: string;
    name: string;
    display_name: string | null;
  };
}

interface Admin {
  id: string;
  email: string;
  name: string;
  display_name: string | null;
}

interface Props {
  campaignId: string;
  currentUserId: string;
}

export default function CampaignMembers({ campaignId, currentUserId }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [availableAdmins, setAvailableAdmins] = useState<Admin[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'editor' | 'viewer'>('viewer');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    memberId: string;
    userName: string;
  }>({ isOpen: false, memberId: '', userName: '' });

  useEffect(() => {
    fetchMembers();
  }, [campaignId]);

  async function fetchMembers() {
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/members`);
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setMembers(data.members);
      setAvailableAdmins(data.availableAdmins);
      setCanManage(data.canManage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          role: selectedRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add member');
      }

      setShowAddForm(false);
      setSelectedUserId('');
      setSelectedRole('viewer');
      await fetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateRole(memberId: string, newRole: string) {
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update role');
      }

      await fetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  function handleRemoveMember(memberId: string, userName: string) {
    setConfirmDialog({ isOpen: true, memberId, userName });
  }

  async function confirmRemoveMember() {
    const { memberId } = confirmDialog;
    setConfirmDialog({ isOpen: false, memberId: '', userName: '' });

    try {
      const res = await fetch(
        `/api/admin/campaigns/${campaignId}/members?member_id=${memberId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      await fetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove');
    }
  }

  // Get admins not already members
  const nonMembers = availableAdmins.filter(
    admin => !members.some(m => m.user.id === admin.id)
  );

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading members...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-sm">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900">Team Members</h2>
          <span className="text-sm text-gray-500">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t px-6 pb-6">
          {/* Add Member Button */}
          {canManage && nonMembers.length > 0 && !showAddForm && (
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Member
              </button>
            </div>
          )}

          {/* Add Member Form */}
          {showAddForm && canManage && (
            <form onSubmit={handleAddMember} className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    User
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    required
                  >
                    <option value="">Select user...</option>
                    {nonMembers.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.display_name || admin.name} ({admin.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'owner' | 'editor' | 'viewer')}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="viewer">Viewer (read-only)</option>
                    <option value="editor">Editor (can edit & gift)</option>
                    <option value="owner">Owner (full control)</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    disabled={saving || !selectedUserId}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Members List */}
          <div className="space-y-3 mt-4">
            {members.length === 0 ? (
              <p className="text-gray-500 text-sm">No members yet.</p>
            ) : (
              members.map((member) => {
                const isCurrentUser = member.user.id === currentUserId;
                const displayName = member.user.display_name || member.user.name;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {displayName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-gray-500">(you)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{member.user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canManage && !isCurrentUser ? (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                            className="text-xs px-2 py-1 border border-gray-200 rounded bg-white"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="owner">Owner</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(member.id, displayName)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded ${
                          member.role === 'owner'
                            ? 'bg-purple-100 text-purple-700'
                            : member.role === 'editor'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Role Legend */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500">
              <strong>Owner:</strong> Full control, manage members |{' '}
              <strong>Editor:</strong> Edit campaign, gift books |{' '}
              <strong>Viewer:</strong> View only
            </p>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Remove Member"
        message={`Remove ${confirmDialog.userName} from this campaign?`}
        confirmText="Remove"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={confirmRemoveMember}
        onCancel={() => setConfirmDialog({ isOpen: false, memberId: '', userName: '' })}
      />
    </div>
  );
}
