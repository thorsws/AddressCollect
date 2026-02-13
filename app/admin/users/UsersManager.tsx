'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'viewer';
  is_active: boolean;
  created_at: string;
}

interface UsersManagerProps {
  initialUsers: User[];
  currentUserId: string;
}

export default function UsersManager({ initialUsers, currentUserId }: UsersManagerProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId: string }>({ isOpen: false, userId: '' });

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'admin' as 'super_admin' | 'admin' | 'viewer',
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setUsers([data.user, ...users]);
      setFormData({ email: '', name: '', role: 'admin' });
      setShowAddForm(false);
      setSuccess(`User ${data.user.email} has been invited!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
    if (userId === currentUserId) {
      setError('Cannot deactivate your own account');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentlyActive }),
      });

      if (!response.ok) throw new Error('Failed to update user');

      setUsers(users.map(user =>
        user.id === userId ? { ...user, is_active: !currentlyActive } : user
      ));
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      setError('Cannot change your own role');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to update user role');

      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole as User['role'] } : user
      ));
      setSuccess('User role updated successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = (userId: string) => {
    if (userId === currentUserId) {
      setError('Cannot delete your own account');
      return;
    }
    setDeleteConfirm({ isOpen: true, userId });
  };

  const confirmDelete = async () => {
    const userId = deleteConfirm.userId;
    setDeleteConfirm({ isOpen: false, userId: '' });

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to delete user');

      setUsers(users.filter(user => user.id !== userId));
      setSuccess('User deleted successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete User"
        message="Delete this user? This action cannot be undone."
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, userId: '' })}
      />

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Add User Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Admin Users ({users.length})</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            {showAddForm ? 'Cancel' : '+ Invite User'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddUser} className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Inviting...' : 'Send Invite'}
              </button>
            </div>
          </form>
        )}

        {/* Role descriptions */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="font-medium text-blue-900 mb-1">Role Permissions:</p>
          <ul className="text-blue-800 space-y-1 ml-4">
            <li><strong>Super Admin:</strong> Full access, can manage users and all campaigns</li>
            <li><strong>Admin:</strong> Can create campaigns and edit their own campaigns</li>
            <li><strong>Viewer:</strong> Read-only access to all campaigns</li>
          </ul>
        </div>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No users yet. Invite one to get started!
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className={user.id === currentUserId ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.id === currentUserId && (
                        <span className="text-xs text-blue-600 font-medium">You</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.id === currentUserId ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(user.role)}`}>
                          {getRoleDisplay(user.role)}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="admin">Admin</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.id !== currentUserId && (
                        <>
                          <button
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
