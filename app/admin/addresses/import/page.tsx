'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportAddressesPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [campaignSlug, setCampaignSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [results, setResults] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

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
      setError('Please enter a campaign slug');
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
      setCampaignSlug('');

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
            <h3 className="text-blue-900 font-semibold mb-2">CSV Format Requirements</h3>
            <p className="text-blue-800 text-sm mb-2">Your CSV file should include the following columns:</p>
            <ul className="text-blue-800 text-sm list-disc list-inside space-y-1">
              <li><strong>firstName</strong> (required)</li>
              <li><strong>lastName</strong> (required)</li>
              <li><strong>email</strong> (optional)</li>
              <li><strong>company</strong> (optional)</li>
              <li><strong>title</strong> (optional)</li>
              <li><strong>phone</strong> (optional)</li>
              <li><strong>address1</strong> (required)</li>
              <li><strong>address2</strong> (optional)</li>
              <li><strong>city</strong> (required)</li>
              <li><strong>region</strong> (required)</li>
              <li><strong>postalCode</strong> (required)</li>
              <li><strong>country</strong> (required, e.g., US, CA, GB)</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="campaignSlug" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="campaignSlug"
                value={campaignSlug}
                onChange={(e) => setCampaignSlug(e.target.value)}
                required
                placeholder="e.g., stanford"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                The campaign slug these addresses should be associated with
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
