import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';

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
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{admin.email}</span>
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
          <a
            href="/admin/addresses"
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700"
          >
            View All Addresses
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaignsWithStats.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">/c/{campaign.slug}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    campaign.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {campaign.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Confirmed:</span>
                  <span className="font-semibold text-gray-900">
                    {campaign.confirmedCount} / {campaign.capacity_total}
                  </span>
                </div>
                {campaign.pendingCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-yellow-600">{campaign.pendingCount}</span>
                  </div>
                )}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (campaign.confirmedCount / campaign.capacity_total) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <a
                  href={`/admin/campaigns/${campaign.id}`}
                  className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                >
                  View Claims
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
          ))}
        </div>

        {campaignsWithStats.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No campaigns yet. Create one to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}
