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
  const [skipRows, setSkipRows] = useState(3);
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
                <option value="confirmed">Confirmed (not yet shipped)</option>
                <option value="shipped">Shipped (already sent)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Use &quot;Shipped&quot; for historical addresses that have already been fulfilled
              </p>
            </div>

            <div>
              <label htmlFor="skipRows" className="block text-sm font-medium text-gray-700 mb-1">
                Skip Header Rows
              </label>
              <input
                type="number"
                id="skipRows"
                value={skipRows}
                onChange={(e) => setSkipRows(parseInt(e.target.value) || 0)}
                min="0"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Number of rows to skip before the column header row (default: 3 for your format)
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
