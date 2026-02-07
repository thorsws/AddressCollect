import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';

export default async function HelpPage() {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">Help & Walkthrough</h1>
            <a href="/admin" className="text-sm text-blue-600 hover:text-blue-700">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Quick Start */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Start Guide</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                AddressCollect helps you collect shipping addresses through customizable campaign pages.
                Perfect for book giveaways, raffles, and promotional campaigns.
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li><strong>Create a campaign</strong> - Set up your collection page with custom messaging</li>
                <li><strong>Share the link</strong> - Send your campaign URL to recipients</li>
                <li><strong>Collect addresses</strong> - Recipients fill out the form</li>
                <li><strong>Export data</strong> - Download addresses as CSV for shipping</li>
              </ol>
            </div>
          </section>

          {/* Creating Campaigns */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Creating Campaigns</h2>
            <div className="space-y-4 text-gray-700">
              <p>Click <strong>Create Campaign</strong> from the dashboard to set up a new collection page.</p>

              <h3 className="text-lg font-semibold text-gray-800 mt-4">Basic Settings</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Title</strong> - The headline shown on the campaign page</li>
                <li><strong>URL Slug</strong> - The unique URL path (e.g., /c/my-campaign)</li>
                <li><strong>Description</strong> - Explain what recipients will receive</li>
                <li><strong>Capacity</strong> - Maximum number of claims (or unlimited)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4">Campaign Options</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Active</strong> - Toggle to enable/disable the campaign</li>
                <li><strong>Require Email</strong> - Collect email addresses</li>
                <li><strong>Email Verification</strong> - Require email confirmation before claim is valid</li>
                <li><strong>Invite Code</strong> - Require a code to access the form</li>
                <li><strong>Show Scarcity</strong> - Display remaining capacity to create urgency</li>
                <li><strong>Test Mode</strong> - Claims marked as test data (for testing)</li>
                <li><strong>Kiosk Mode</strong> - Show &quot;Submit Another&quot; button after success (for shared devices)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4">Additional Fields</h3>
              <p>Optionally collect company name, job title, or phone number.</p>
            </div>
          </section>

          {/* Managing Claims */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Claims</h2>
            <div className="space-y-4 text-gray-700">
              <p>View all submissions from the campaign details page.</p>

              <h3 className="text-lg font-semibold text-gray-800 mt-4">Claim Statuses</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong className="text-yellow-600">Pending</strong> - Awaiting email verification</li>
                <li><strong className="text-green-600">Confirmed</strong> - Ready to ship</li>
                <li><strong className="text-red-600">Rejected</strong> - Marked as invalid</li>
                <li><strong className="text-blue-600">Shipped</strong> - Item has been sent</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4">Actions</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Mark as Shipped</strong> - Track which items have been sent</li>
                <li><strong>Reject</strong> - Mark invalid claims</li>
                <li><strong>Add Notes</strong> - Internal notes for your reference</li>
                <li><strong>Copy Address</strong> - Quick copy for shipping labels</li>
              </ul>
            </div>
          </section>

          {/* Pre-Created Claims */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pre-Created Claims (Invite Links)</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Create personalized invite links for specific people. Enter their name and email,
                and the system generates a unique link they can use to complete their address.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Recipient clicks the link and only needs to enter their address</li>
                <li>Their name and email are pre-filled</li>
                <li>Great for VIP invitations or tracking specific recipients</li>
              </ul>
            </div>
          </section>

          {/* Invite Codes */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invite Codes</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                If your campaign requires invite codes, you can create and manage them from the campaign details page.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Create codes with optional usage limits</li>
                <li>Track which codes have been used</li>
                <li>Disable codes that are no longer valid</li>
              </ul>
            </div>
          </section>

          {/* Exporting Data */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Exporting Addresses</h2>
            <div className="space-y-4 text-gray-700">
              <p>Download your collected addresses as a CSV file for shipping or mail merge.</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Per Campaign</strong> - Click &quot;Export CSV&quot; on the campaign page</li>
                <li><strong>All Campaigns</strong> - Use &quot;All Addresses&quot; from the dashboard</li>
              </ul>
              <p className="mt-2">
                The CSV includes: name, email, full address, status, and submission date.
              </p>
            </div>
          </section>

          {/* User Roles */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Roles</h2>
            <div className="space-y-4 text-gray-700">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Super Admin</strong> - Full access: manage users, delete campaigns/claims, edit all campaigns
                </li>
                <li>
                  <strong>Admin</strong> - Create campaigns, edit own campaigns, view all campaigns
                </li>
                <li>
                  <strong>Viewer</strong> - Read-only access to all campaigns and claims
                </li>
              </ul>
            </div>
          </section>

          {/* Tips */}
          <section className="bg-blue-50 rounded-lg shadow-md p-6 border border-blue-200">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Pro Tips</h2>
            <div className="space-y-3 text-blue-800">
              <p><strong>Use Test Mode</strong> - Enable test mode while setting up to avoid counting test submissions.</p>
              <p><strong>Kiosk Mode for Events</strong> - Enable kiosk mode when collecting addresses on a shared iPad/tablet at events.</p>
              <p><strong>Email Verification</strong> - Enable for public campaigns to ensure valid email addresses.</p>
              <p><strong>Privacy Messaging</strong> - Customize the privacy blurb to build trust with your recipients.</p>
              <p><strong>Contact Email</strong> - Add a contact email so recipients can reach out with questions.</p>
            </div>
          </section>

          {/* Support */}
          <section className="bg-gray-100 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Need More Help?</h2>
            <p className="text-gray-700">
              Contact your administrator or reach out to{' '}
              <a href="mailto:jan.rosen@rallertechnologies.com" className="text-blue-600 hover:text-blue-700 underline">
                jan.rosen@rallertechnologies.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
