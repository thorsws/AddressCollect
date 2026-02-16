import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { canManageUsers } from '@/lib/admin/permissions';
import MobileNav from '../MobileNav';

export default async function AdminLeaderboardPage() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    redirect('/admin/login');
  }

  // Fetch leaderboard campaigns (active, not hidden, show_in_leaderboard)
  const { data: campaigns } = await supabaseAdmin
    .from('campaigns')
    .select('id, internal_title, capacity_total')
    .eq('is_active', true)
    .eq('show_in_leaderboard', true)
    .eq('is_hidden', false);

  // Get registered counts
  const leaderboard = await Promise.all(
    (campaigns || []).map(async (campaign) => {
      const { count } = await supabaseAdmin
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('is_test_claim', false)
        .neq('address1', '')
        .not('address1', 'is', null);

      return {
        id: campaign.id,
        name: campaign.internal_title,
        capacity: campaign.capacity_total,
        count: count || 0,
      };
    })
  );

  // Sort by count DESC
  leaderboard.sort((a, b) => b.count - a.count);
  const maxCount = leaderboard[0]?.count || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Nav */}
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
                  <Link href="/admin/users" className="text-sm text-purple-600 hover:text-purple-700 font-semibold">
                    Manage Users
                  </Link>
                  <Link href="/admin/global-settings" className="text-sm text-purple-600 hover:text-purple-700 font-semibold">
                    Global Settings
                  </Link>
                </>
              )}
              <Link href="/admin/settings" className="text-sm text-gray-700 hover:text-gray-900 font-medium">
                Profile
              </Link>
              <Link href="/admin/help" className="text-sm text-gray-700 hover:text-gray-900 font-medium">
                Help
              </Link>
              <form action="/api/admin/auth/logout" method="POST">
                <button type="submit" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Leaderboard</h1>
          <p className="text-sm text-gray-600">Campaigns ranked by registrations.</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {leaderboard.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No campaigns in the leaderboard yet.
            </p>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((entry, index) => {
                const barWidth = maxCount > 0 ? Math.max((entry.count / maxCount) * 100, 2) : 2;
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                return (
                  <div key={entry.id} className="flex items-center gap-3 sm:gap-4">
                    <span className={`text-lg font-bold w-8 text-right shrink-0 ${
                      isFirst ? 'text-yellow-500' : isSecond ? 'text-gray-400' : isThird ? 'text-amber-600' : 'text-gray-300'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/campaigns/${entry.id}`}
                        className="text-sm sm:text-base font-semibold text-gray-900 hover:text-blue-600 truncate block"
                      >
                        {entry.name}
                      </Link>
                      <div className="mt-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFirst ? 'bg-yellow-400' : isSecond ? 'bg-gray-300' : isThird ? 'bg-amber-500' : 'bg-green-400'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-gray-900 w-20 text-right shrink-0">
                      {entry.count}
                      {entry.capacity && entry.capacity > 0
                        ? <span className="text-gray-400 font-normal text-sm"> / {entry.capacity}</span>
                        : null}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
