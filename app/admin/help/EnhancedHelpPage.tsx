'use client';

import { useState } from 'react';

export default function EnhancedHelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('');

  const sections = [
    { id: 'quick-start', title: 'Quick Start Guide', icon: '🚀' },
    { id: 'campaigns', title: 'Creating Campaigns', icon: '📝' },
    { id: 'preview', title: 'Preview & QR Codes', icon: '👁️' },
    { id: 'claims', title: 'Managing Claims', icon: '📋' },
    { id: 'filters', title: 'Filtering & Search', icon: '🔍' },
    { id: 'import', title: 'Importing Addresses', icon: '📥' },
    { id: 'export', title: 'Exporting Data', icon: '📤' },
    { id: 'pre-created', title: 'Pre-Created Claims', icon: '✉️' },
    { id: 'invite-codes', title: 'Invite Codes', icon: '🎫' },
    { id: 'questions', title: 'Custom Questions', icon: '❓' },
    { id: 'users', title: 'User Roles', icon: '👥' },
    { id: 'tips', title: 'Pro Tips', icon: '💡' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
      // Highlight briefly
      element.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50');
      }, 2000);
    }
  };

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 mb-3">Contents</h2>
          <input
            type="text"
            placeholder="Search help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <nav className="p-2">
          {filteredSections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                activeSection === section.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Help & Documentation</h1>
            <a href="/admin" className="text-blue-600 hover:text-blue-700">
              ← Back to Dashboard
            </a>
          </div>

          <div className="space-y-8">
            {/* Quick Start */}
            <section id="quick-start" className="bg-white rounded-lg shadow-md p-6 transition-all">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Quick Start Guide</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  AddressCollect helps you collect shipping addresses through customizable campaign pages.
                  Perfect for giveaways, raffles, promotional campaigns, and any situation where you need to collect physical addresses at scale.
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li><strong>Create a campaign</strong> - Set up your collection page with custom messaging</li>
                  <li><strong>Preview & share</strong> - Use the preview button to see it, then share your campaign URL</li>
                  <li><strong>Collect addresses</strong> - Recipients fill out the form</li>
                  <li><strong>Export data</strong> - Download addresses as CSV for shipping or mailing</li>
                </ol>
              </div>
            </section>

            {/* Creating Campaigns */}
            <section id="campaigns" className="bg-white rounded-lg shadow-md p-6 transition-all">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Creating Campaigns</h2>
              <div className="space-y-4 text-gray-700">
                <p>Click <strong>Create Campaign</strong> from the dashboard to set up a new collection page.</p>

                <h3 className="text-lg font-semibold text-gray-800 mt-4">Basic Settings</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Title</strong> - The headline shown on the campaign page</li>
                  <li><strong>URL Slug</strong> - The unique URL path (e.g., /c/my-campaign)</li>
                  <li><strong>Description</strong> - Markdown supported! Add formatting, links, etc.</li>
                  <li><strong>Capacity</strong> - Maximum number of claims (or unlimited)</li>
                  <li><strong>Banner Image</strong> - Optional header image for your campaign</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-4">Campaign Options</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Active</strong> - Toggle to enable/disable the campaign</li>
                  <li><strong>Require Email</strong> - Collect email addresses</li>
                  <li><strong>Email Verification</strong> - Require email confirmation before claim is valid</li>
                  <li><strong>Invite Code</strong> - Require a code to access the form</li>
                  <li><strong>Show Scarcity</strong> - Display remaining capacity</li>
                  <li><strong>Contact Information</strong> - Optional checkbox for company/phone/title fields</li>
                  <li><strong>Test Mode</strong> - Claims marked as test data</li>
                  <li><strong>Kiosk Mode</strong> - Show &quot;Submit Another&quot; button (for shared devices)</li>
                </ul>
              </div>
            </section>

            {/* Preview & QR */}
            <section id="preview" className="bg-white rounded-lg shadow-md p-6 transition-all">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">👁️ Preview & QR Codes</h2>
              <div className="space-y-4 text-gray-700">
                <p>From any campaign detail page:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Preview Campaign</strong> (purple button) - Opens the campaign in a modal overlay so you can see exactly what users will see</li>
                  <li><strong>QR Code</strong> - Automatically generated for easy sharing at events</li>
                  <li><strong>Copy QR Code</strong> - Click to copy to clipboard</li>
                  <li><strong>Download QR Code</strong> - Save as PNG for printing</li>
                </ul>
              </div>
            </section>

            {/* Managing Claims */}
            <section id="claims" className="bg-white rounded-lg shadow-md p-6 transition-all">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Managing Claims</h2>
              <div className="space-y-4 text-gray-700">
                <p>View all submissions from the campaign details page.</p>

                <h3 className="text-lg font-semibold text-gray-800 mt-4">Claim Statuses</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong className="text-yellow-600">Pending</strong> - Awaiting email verification</li>
                  <li><strong className="text-green-600">Confirmed</strong> - Verified and ready to process</li>
                  <li><strong className="text-red-600">Rejected</strong> - Marked as invalid or declined</li>
                  <li><strong className="text-blue-600">Sent</strong> - Item has been shipped or fulfilled (with timestamp)</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-4">Actions</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Mark as Sent</strong> - Record when items have been shipped/fulfilled</li>
                  <li><strong>Change Status</strong> - Update claim status as needed</li>
                  <li><strong>Add Notes</strong> - Internal notes for tracking and reference</li>
                  <li><strong>Copy Address</strong> - Quick copy for shipping labels or mailing</li>
                  <li><strong>Delete (Super Admin)</strong> - Permanently remove claims if needed</li>
                </ul>
              </div>
            </section>

            {/* Filters */}
            <section id="filters" className="bg-white rounded-lg shadow-md p-6 transition-all">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🔍 Filtering & Search</h2>
              <div className="space-y-4 text-gray-700">
                <p>On the &quot;All Addresses&quot; page, you can filter claims by:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Status</strong> - Confirmed, Pending, Rejected</li>
                  <li><strong>Sent</strong> - Sent Only, Not Sent, All</li>
                  <li><strong>Type</strong> - Pre-Created Only, Regular Only, All</li>
                  <li><strong>Test Claims</strong> - Toggle to show/hide test data</li>
                </ul>
                <p className="mt-3">
                  Combine filters to find exactly what you need, like &quot;Confirmed + Not Sent&quot; to see addresses ready to send.
                </p>
              </div>
            </section>

            {/* Import */}
            <section id="import" className="bg-white rounded-lg shadow-md p-6 transition-all">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📥 Importing Addresses</h2>
              <div className="space-y-4 text-gray-700">
                <p>Import historical or bulk addresses via CSV at <strong>/admin/addresses/import</strong></p>

                <h3 className="text-lg font-semibold text-gray-800 mt-4">Features</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Flexible CSV format</strong> - Handles &quot;Full Name&quot;, &quot;Street Address 1/2&quot;, &quot;State&quot;, &quot;Zip&quot;, etc.</li>
                  <li><strong>Campaign selection</strong> - Choose which campaign to import into</li>
                  <li><strong>Status selection</strong> - Mark as Confirmed or Sent</li>
                  <li><strong>Sent date support</strong> - Reads &quot;Sent to Charlie Date?&quot; column or use default date</li>
                  <li><strong>Skip header rows</strong> - Configure how many rows to skip (default 3)</li>
                  <li><strong>Auto-deduplication</strong> - Skips duplicates across ALL campaigns</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-4">Supported Columns</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  Full Name (or firstName/lastName), Email, Company, Role/Title, Phone,
                  Street Address 1/2, City, State, Zip, Country, Sent to Charlie Date?
                </div>
              </div>
            </section>

            {/* Export */}
            <section id="export" className="bg-white rounded-lg shadow-md p-6 transition-all">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📤 Exporting Data</h2>
              <div className="space-y-4 text-gray-700">
                <p>Download your collected addresses as CSV files:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Per Campaign</strong> - Click &quot;Export CSV&quot; on any campaign page</li>
                  <li><strong>All Campaigns</strong> - Use &quot;Export All CSV&quot; from All Addresses page</li>
                  <li><strong>Filtered Export</strong> - Apply filters, then click &quot;Export Filtered (X)&quot; to export only what you&apos;re viewing</li>
                </ul>
                <p className="mt-3">
                  CSV includes: Campaign, Status, Name, Email, Company, Title, Phone, Full Address, Created Date, Sent Date, Test/Pre-Created flags
                </p>
              </div>
            </section>

            {/* Pre-Created Claims */}
            <section id="pre-created" className="bg-white rounded-lg shadow-md p-6 transition-all">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">✉️ Pre-Created Claims (Invite Links)</h2>
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
            <section id="invite-codes" className="bg-white rounded-lg shadow-md p-6 transition-all">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🎫 Invite Codes</h2>
              <div className="space-y-4 text-gray-700">
                <p>If your campaign requires invite codes, manage them from the campaign details page:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Create codes with optional usage limits</li>
                  <li>Track which codes have been used and how many times</li>
                  <li>Disable codes that are no longer valid</li>
                </ul>
              </div>
            </section>

            {/* Questions */}
            <section id="questions" className="bg-white rounded-lg shadow-md p-6 transition-all">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">❓ Custom Questions</h2>
              <div className="space-y-4 text-gray-700">
                <p>Add custom questions to your campaign form:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Text questions</strong> - Short or long text responses</li>
                  <li><strong>Multiple choice</strong> - Dropdown or radio button options</li>
                  <li><strong>Required/Optional</strong> - Control which questions must be answered</li>
                  <li><strong>Reorder</strong> - Drag to change question order</li>
                </ul>
                <p className="mt-3">Great for collecting additional info like shirt size, dietary restrictions, etc.</p>
              </div>
            </section>

            {/* User Roles */}
            <section id="users" className="bg-white rounded-lg shadow-md p-6 transition-all">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">👥 User Roles</h2>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Super Admin</strong> - Full access: manage users, delete campaigns/claims, edit all campaigns</li>
                  <li><strong>Admin</strong> - Create campaigns, edit own campaigns, view all campaigns</li>
                  <li><strong>Viewer</strong> - Read-only access to all campaigns and claims</li>
                </ul>
              </div>
            </section>

            {/* Tips */}
            <section id="tips" className="bg-blue-50 rounded-lg shadow-md p-6 border border-blue-200 transition-all">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">💡 Pro Tips</h2>
              <div className="space-y-3 text-blue-800">
                <p><strong>Use Test Mode</strong> - Enable while setting up to avoid counting test submissions in your campaign</p>
                <p><strong>Kiosk Mode for Events</strong> - Perfect for collecting addresses on a shared device (iPad, tablet, or laptop at events)</p>
                <p><strong>Email Verification</strong> - Enable for public campaigns to ensure valid email addresses and reduce spam</p>
                <p><strong>Preview Before Sharing</strong> - Always preview your campaign to check formatting and messaging before sharing</p>
                <p><strong>QR Codes for Events</strong> - Print QR codes for easy sign-ups at conferences, events, or physical locations</p>
                <p><strong>Filter Before Export</strong> - Apply filters to export only what you need (e.g., confirmed & not sent)</p>
                <p><strong>Import Historical Data</strong> - Upload past campaigns or shipments to keep all your data centralized</p>
                <p><strong>Custom Questions</strong> - Add campaign-specific questions to collect additional data beyond addresses</p>
                <p><strong>Pre-Created Claims</strong> - Create personalized invite links for VIP recipients or targeted campaigns</p>
                <p><strong>Multiple Campaigns</strong> - Track different initiatives separately with unique URLs and settings</p>
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
        </div>
      </main>
    </div>
  );
}
