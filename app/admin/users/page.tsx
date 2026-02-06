import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { canManageUsers } from '@/lib/admin/permissions';
import { supabaseAdmin } from '@/lib/supabase/server';
import UsersManager from './UsersManager';

export default async function UsersPage() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    redirect('/admin/login');
  }

  // Check permission
  if (!canManageUsers(admin.role)) {
    redirect('/admin');
  }

  // Fetch all users
  const { data: users, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, name, role, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Error loading users: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <a href="/admin" className="text-blue-600 hover:text-blue-800 text-sm">
            ← Back to Dashboard
          </a>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage admin users and their permissions
          </p>
        </div>

        <UsersManager initialUsers={users || []} currentUserId={admin.id} />
      </div>
    </div>
  );
}
