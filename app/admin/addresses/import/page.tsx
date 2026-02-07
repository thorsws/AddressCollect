'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Campaign {
  id: string;
  slug: string;
  title: string;
}

export default function ImportAddressesPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignSlug, setCampaignSlug] = useState('');
  const [status, setStatus] = useState<'confirmed' | 'shipped'>('shipped');
  const [skipRows, setSkipRows] = useState(-1); // -1 = auto-detect
  const [defaultShippedDate, setDefaultShippedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [results, setResults] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    if (!campaignSlug) {
      setError('Please select a campaign');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('campaignSlug', campaignSlug);
      formData.append('status', status);
      formData.append('skipRows', skipRows.toString());
      if (defaultShippedDate) {
        formData.append('defaultShippedDate', defaultShippedDate);
      }

      const response = await fetch('/api/admin/addresses/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to import addresses');
        setLoading(false);
        return;
      }

      setResults(data);
      setSuccess(`Successfully imported ${data.imported} addresses!`);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('csvFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <a href="/admin/addresses" className="text-blue-600 hover:text-blue-700">
                ← Back to Addresses
              </a>
              <span className="text-gray-300">|</span>
              <h1 className="text-xl font-bold text-gray-900">Import Addresses</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Addresses from CSV</h2>

          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-900 font-semibold mb-2">CSV Format</h3>
            <p className="text-blue-800 text-sm mb-2">Supports flexible column names:</p>
            <ul className="text-blue-800 text-sm list-disc list-inside space-y-1">
              <li><strong>Full Name</strong> or <strong>firstName/lastName</strong> (required)</li>
              <li><strong>Email</strong> (optional)</li>
              <li><strong>Company</strong> (optional)</li>
              <li><strong>Role/Title</strong> (optional)</li>
              <li><strong>Phone</strong> (optional)</li>
              <li><strong>Street Address 1</strong> or <strong>address1</strong> (required)</li>
              <li><strong>Street Address 2</strong> or <strong>address2</strong> (optional)</li>
              <li><strong>City</strong> (required)</li>
              <li><strong>State/region</strong> (required)</li>
              <li><strong>Zip/postalCode</strong> (required)</li>
              <li><strong>Country</strong> (defaults to US if missing)</li>
              <li><strong>Sent to Charlie Date?</strong> or <strong>Sent Date</strong> (optional, e.g. &quot;Jan 30&quot; or &quot;1/30/2024&quot;)</li>
            </ul>
            <p className="text-blue-800 text-sm mt-2">
              <strong>Note:</strong> Duplicate addresses across ALL campaigns will be skipped automatically.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="campaign" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign <span className="text-red-500">*</span>
              </label>
              <select
                id="campaign"
                value={campaignSlug}
                onChange={(e) => setCampaignSlug(e.target.value)}
                required
                disabled={loadingCampaigns}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a campaign...</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.slug}>
                    {campaign.title} ({campaign.slug})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Choose which campaign these addresses belong to
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'confirmed' | 'shipped')}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="confirmed">Confirmed (not yet sent)</option>
                <option value="shipped">Sent (already sent)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Use &quot;Sent&quot; for historical addresses that have already been fulfilled
              </p>
            </div>

            {status === 'shipped' && (
              <div>
                <label htmlFor="defaultShippedDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Sent Date (Optional)
                </label>
                <input
                  type="date"
                  id="defaultShippedDate"
                  value={defaultShippedDate}
                  onChange={(e) => setDefaultShippedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Used if CSV doesn&apos;t have &quot;Sent to Charlie Date?&quot; column. Leave blank to use today.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="skipRows" className="block text-sm font-medium text-gray-700 mb-1">
                Header Row Detection
              </label>
              <select
                id="skipRows"
                value={skipRows}
                onChange={(e) => setSkipRows(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="-1">🤖 Auto-detect (recommended)</option>
                <option value="0">Row 1 (no rows to skip)</option>
                <option value="1">Row 2 (skip 1 row)</option>
                <option value="2">Row 3 (skip 2 rows)</option>
                <option value="3">Row 4 (skip 3 rows)</option>
                <option value="4">Row 5 (skip 4 rows)</option>
                <option value="5">Row 6 (skip 5 rows)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Auto-detect finds the header row automatically by looking for column names like &quot;Full Name&quot;, &quot;Email&quot;, &quot;City&quot;
              </p>
            </div>

            <div>
              <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-1">
                CSV File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleFileChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {file && (
                <p className="mt-1 text-sm text-green-600">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-900 text-sm font-semibold">Processing CSV file...</p>
                    <p className="text-blue-700 text-xs mt-1">Parsing addresses and checking for duplicates. This may take a moment.</p>
                  </div>
                </div>
                <div className="mt-3 w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800 text-sm font-semibold">{success}</p>
                {results && (
                  <div className="mt-2 text-sm text-green-700">
                    <p>Imported: {results.imported}</p>
                    <p>Skipped (duplicates): {results.skipped}</p>
                    {results.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Errors:</p>
                        <ul className="list-disc list-inside">
                          {results.errors.slice(0, 10).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {results.errors.length > 10 && (
                            <li>... and {results.errors.length - 10} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.push('/admin/addresses')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !file || !campaignSlug}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing...' : 'Import Addresses'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
