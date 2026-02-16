import { supabaseAdmin } from '@/lib/supabase/server';

interface LeaderboardPageProps {
  searchParams: Promise<{ key?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { key } = await searchParams;

  // Fetch leaderboard settings
  const { data: settingsRows } = await supabaseAdmin
    .from('global_settings')
    .select('key, value')
    .in('key', ['leaderboard_enabled', 'leaderboard_key', 'leaderboard_title']);

  const settingsMap: Record<string, string> = {};
  (settingsRows || []).forEach((s: { key: string; value: string }) => {
    settingsMap[s.key] = s.value;
  });

  const enabled = settingsMap['leaderboard_enabled'] === 'true';
  const expectedKey = settingsMap['leaderboard_key'] || '';
  const title = settingsMap['leaderboard_title'] || 'Leaderboard';

  // Validate access
  if (!enabled || !expectedKey || key !== expectedKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Leaderboard Not Available</h1>
          <p className="text-gray-600">This leaderboard is currently not accessible.</p>
        </div>
      </div>
    );
  }

  // Fetch leaderboard campaigns
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
  const top = leaderboard.slice(0, 10);
  const maxCount = top[0]?.count || 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-start justify-center p-4 pt-12 sm:pt-20">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {top.length === 0 ? (
            <p className="text-center text-gray-500">No campaigns to show yet.</p>
          ) : (
            <div className="space-y-4">
              {top.map((entry, index) => {
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
                      <p className={`text-sm sm:text-base font-semibold text-gray-900 truncate ${isFirst ? 'text-base sm:text-lg' : ''}`}>
                        {entry.name}
                      </p>
                      <div className="mt-1 bg-gray-100 rounded-full h-4 sm:h-5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFirst ? 'bg-yellow-400' : isSecond ? 'bg-gray-300' : isThird ? 'bg-amber-500' : 'bg-green-400'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-gray-900 w-16 text-right shrink-0">
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

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by Cognitive Kin
        </p>
      </div>
    </div>
  );
}
