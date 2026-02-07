import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { canManageUsers } from '@/lib/admin/permissions';
import CampaignsFilter from './CampaignsFilter';

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    redirect('/admin/login');
  }

  // Fetch all campaigns with claim counts
  const { data: campaigns } = await supabaseAdmin
    .from('campaigns')
    .select('*, claims(count)')
    .order('created_at', { ascending: false });

  const campaignsWithStats = await Promise.all(
    (campaigns || []).map(async (campaign) => {
      const { count: confirmedCount } = await supabaseAdmin
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('status', 'confirmed');

      const { count: pendingCount } = await supabaseAdmin
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('status', 'pending');

      return {
        ...campaign,
        confirmedCount: confirmedCount || 0,
        pendingCount: pendingCount || 0,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <img src="/cognitive-kin-logo.png" alt="Cognitive Kin" className="h-8 w-auto" />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {admin.name} ({admin.role === 'super_admin' ? 'Super Admin' : admin.role === 'admin' ? 'Admin' : 'Viewer'})
              </span>
              {canManageUsers(admin.role) && (
                <Link
                  href="/admin/users"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Manage Users
                </Link>
              )}
              <Link
                href="/admin/help"
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Help
              </Link>
              <form action="/api/admin/auth/logout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaigns</h2>
            <p className="text-gray-600">Manage your giveaway campaigns and view claims.</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/admin/campaigns/create"
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
            >
              + Create Campaign
            </Link>
            <Link
              href="/admin/addresses"
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700"
            >
              View All Addresses
            </Link>
          </div>
        </div>

        {campaignsWithStats.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No campaigns yet. Create one to get started.</p>
          </div>
        ) : (
          <CampaignsFilter campaigns={campaignsWithStats} currentUserEmail={admin.email} />
        )}
      </main>
    </div>
  );
}
