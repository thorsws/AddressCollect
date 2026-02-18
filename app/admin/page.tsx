import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { canManageUsers } from '@/lib/admin/permissions';
import CampaignsFilter from './CampaignsFilter';
import MobileNav from './MobileNav';

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    redirect('/admin/login');
  }

  // Fetch campaigns, favorites, and claim stats in parallel
  const [campaignsResult, favoritesResult, claimStatsResult] = await Promise.all([
    // 1. Fetch all campaigns with creator info
    supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        claims(count),
        creator:admin_users!created_by(id, email, name)
      `)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false }),
    // 2. Fetch this user's favorites
    supabaseAdmin
      .from('campaign_favorites')
      .select('campaign_id')
      .eq('user_id', admin.id),
    // 3. Fetch all non-test claims with minimal fields for counting
    supabaseAdmin
      .from('claims')
      .select('campaign_id, status, address1')
      .eq('is_test_claim', false),
  ]);

  const campaigns = campaignsResult.data || [];
  const favoritedIds = new Set((favoritesResult.data || []).map(f => f.campaign_id));

  // Count registered and pending per campaign in memory (avoids N*2 DB queries)
  const registeredCounts: Record<string, number> = {};
  const pendingCounts: Record<string, number> = {};
  (claimStatsResult.data || []).forEach(claim => {
    if (claim.address1 && claim.address1 !== '') {
      registeredCounts[claim.campaign_id] = (registeredCounts[claim.campaign_id] || 0) + 1;
    }
    if (claim.status === 'pending') {
      pendingCounts[claim.campaign_id] = (pendingCounts[claim.campaign_id] || 0) + 1;
    }
  });

  const campaignsWithStats = campaigns.map((campaign) => ({
    ...campaign,
    is_favorited: favoritedIds.has(campaign.id),
    registeredCount: registeredCounts[campaign.id] || 0,
    pendingCount: pendingCounts[campaign.id] || 0,
    creatorName: campaign.creator?.name || campaign.creator?.email || 'Unknown',
    creatorEmail: campaign.creator?.email || null,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Nav - only show on large screens */}
      <nav className="hidden lg:block bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <img src="/cognitive-kin-logo.svg" alt="Cognitive Kin" className="h-8 w-auto" />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 font-semibold">
                {admin.name} ({admin.role === 'super_admin' ? 'Super Admin' : admin.role === 'admin' ? 'Admin' : 'Viewer'})
              </span>
              {canManageUsers(admin.role) && (
                <>
                  <Link
                    href="/admin/users"
                    className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    Manage Users
                  </Link>
                  <Link
                    href="/admin/global-settings"
                    className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    Global Settings
                  </Link>
                </>
              )}
              <Link
                href="/admin/settings"
                className="text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Profile
              </Link>
              <Link
                href="/admin/help"
                className="text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Help
              </Link>
              <form action="/api/admin/auth/logout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <MobileNav
        adminName={admin.name}
        adminRole={admin.role}
        canManageUsers={canManageUsers(admin.role)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header - stacks on mobile */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Campaigns</h2>
            <p className="text-sm md:text-base text-gray-700 font-medium">Manage your giveaway campaigns and view claims.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link
              href="/admin/campaigns/create"
              className="px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 text-center"
            >
              + Create Campaign
            </Link>
            <Link
              href="/admin/leaderboard"
              className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 text-center"
            >
              Leaderboard
            </Link>
            <Link
              href="/admin/addresses"
              className="px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 text-center"
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
          <CampaignsFilter campaigns={campaignsWithStats} currentUserEmail={admin.email} isSuperAdmin={admin.role === 'super_admin'} />
        )}
      </main>
    </div>
  );
}
