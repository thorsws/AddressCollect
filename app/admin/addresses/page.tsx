import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import ClaimsFilter from './ClaimsFilter';

export default async function AllAddressesPage() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    redirect('/admin/login');
  }

  // Fetch all claims with campaign info
  const { data: claims } = await supabaseAdmin
    .from('claims')
    .select(`
      *,
      campaigns (
        slug,
        title
      )
    `)
    .order('created_at', { ascending: false });

  // Get total counts
  const totalClaims = claims?.length || 0;
  const confirmedClaims = claims?.filter(c => c.status === 'confirmed').length || 0;
  const pendingClaims = claims?.filter(c => c.status === 'pending').length || 0;
  const preCreatedClaims = claims?.filter(c => c.claim_token && !c.address1).length || 0;
  const shippedClaims = claims?.filter(c => c.shipped_at).length || 0;
  const testClaims = claims?.filter(c => c.is_test_claim).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <a href="/admin" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                <img src="/cognitive-kin-logo.svg" alt="Cognitive Kin" className="h-6 w-auto" />
                <span>← Dashboard</span>
              </a>
              <span className="text-gray-300">|</span>
              <h1 className="text-xl font-bold text-gray-900">All Addresses</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/admin/addresses/import"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
              >
                Import CSV
              </a>
              <a
                href="/api/admin/addresses/export"
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
              >
                Export All CSV
              </a>
              <span className="text-sm text-gray-600">{admin.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Addresses</p>
              <p className="text-2xl font-bold text-gray-900">{totalClaims}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email Verified</p>
              <p className="text-2xl font-bold text-green-600">{confirmedClaims}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingClaims}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pre-Created</p>
              <p className="text-2xl font-bold text-orange-600">{preCreatedClaims}</p>
              <p className="text-xs text-gray-500">Awaiting submission</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Test</p>
              <p className="text-2xl font-bold text-purple-600">{testClaims}</p>
              <p className="text-xs text-gray-500">Not counted</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-blue-600">{shippedClaims}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Claims Across Campaigns</h2>
          </div>

          <ClaimsFilter claims={claims || []} userRole={admin.role} />
        </div>
      </main>
    </div>
  );
}
