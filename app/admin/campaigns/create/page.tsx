'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCampaign() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [unlimitedCapacity, setUnlimitedCapacity] = useState(false);
  const [bannerType, setBannerType] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    capacity_total: 100,
    is_active: true,
    require_email: true,
    require_email_verification: false,
    require_invite_code: false,
    show_scarcity: true,
    collect_company: false,
    collect_phone: false,
    collect_title: false,
    privacy_blurb: "We only use your information to fulfill your request. We won't sell your data.",
    max_claims_per_email: 1,
    max_claims_per_ip_per_day: 5,
    test_mode: false,
    show_banner: true,
    banner_url: 'https://cognitivekin.com',
    show_logo: false,
    contact_email: '',
    contact_text: 'If you have any questions, please email',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setFormData({ ...formData, banner_url: result.url });
      setUploadedFileName(file.name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity_total: unlimitedCapacity ? null : formData.capacity_total,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">Create Campaign</h1>
            <a
              href="/admin"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Stanford Book Giveaway"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug * <span className="text-gray-500 text-xs">(/c/your-slug)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="stanford-book"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL will be: /c/{formData.slug || 'your-slug'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Get your free copy of our book! We'll ship it directly to you."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Capacity
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity_total}
                    onChange={(e) => setFormData({ ...formData, capacity_total: parseInt(e.target.value) || 100 })}
                    disabled={unlimitedCapacity}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${unlimitedCapacity ? 'bg-gray-100 text-gray-400' : ''}`}
                  />
                  <label className="flex items-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={unlimitedCapacity}
                      onChange={(e) => setUnlimitedCapacity(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Unlimited (raffle mode)</span>
                  </label>
                </div>
                {unlimitedCapacity && (
                  <p className="text-xs text-blue-600 mt-1">No capacity limit - good for raffles and signups</p>
                )}
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Campaign is active</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.require_email}
                  onChange={(e) => setFormData({ ...formData, require_email: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Require email address</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.require_email_verification}
                  onChange={(e) => setFormData({ ...formData, require_email_verification: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={!formData.require_email}
                />
                <span className={`ml-2 text-sm ${formData.require_email ? 'text-gray-700' : 'text-gray-400'}`}>
                  Require email verification
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.require_invite_code}
                  onChange={(e) => setFormData({ ...formData, require_invite_code: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Require invite code</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.show_scarcity}
                  onChange={(e) => setFormData({ ...formData, show_scarcity: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show scarcity (remaining capacity)</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.test_mode}
                  onChange={(e) => setFormData({ ...formData, test_mode: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Test mode (claims don&apos;t count toward capacity)</span>
              </label>
            </div>
          </div>

          {/* Collect Fields */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Collect Additional Fields</h2>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.collect_company}
                  onChange={(e) => setFormData({ ...formData, collect_company: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Collect company name</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.collect_title}
                  onChange={(e) => setFormData({ ...formData, collect_title: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Collect job title</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.collect_phone}
                  onChange={(e) => setFormData({ ...formData, collect_phone: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Collect phone number</span>
              </label>
            </div>
          </div>

          {/* Privacy & Limits */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Rate Limits</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Privacy Blurb
                </label>
                <textarea
                  value={formData.privacy_blurb}
                  onChange={(e) => setFormData({ ...formData, privacy_blurb: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max claims per email
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_claims_per_email}
                    onChange={(e) => setFormData({ ...formData, max_claims_per_email: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max claims per IP/day
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_claims_per_ip_per_day}
                    onChange={(e) => setFormData({ ...formData, max_claims_per_ip_per_day: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Email */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email (optional)
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="support@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If provided, this email will be shown on the campaign page
                </p>
              </div>

              {formData.contact_email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Text
                  </label>
                  <input
                    type="text"
                    value={formData.contact_text}
                    onChange={(e) => setFormData({ ...formData, contact_text: e.target.value })}
                    placeholder="If you have any questions, please email"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Preview: {formData.contact_text} <a className="text-blue-600">{formData.contact_email}</a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview Banner */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview Banner</h2>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.show_banner}
                  onChange={(e) => setFormData({ ...formData, show_banner: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show preview banner on campaign page</span>
              </label>

              {formData.show_banner && (
                <div className="space-y-4">
                  {/* Banner Type Selection */}
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="bannerType"
                        checked={bannerType === 'url'}
                        onChange={() => setBannerType('url')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Use URL (fetch Open Graph)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="bannerType"
                        checked={bannerType === 'upload'}
                        onChange={() => setBannerType('upload')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Upload custom image</span>
                    </label>
                  </div>

                  {bannerType === 'url' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Banner URL
                      </label>
                      <input
                        type="url"
                        value={formData.banner_url}
                        onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                        placeholder="https://cognitivekin.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        We&apos;ll fetch Open Graph metadata from this URL to display as a preview card
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Banner Image
                      </label>
                      <div className="flex items-center space-x-3">
                        <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-300">
                          {uploading ? 'Uploading...' : 'Choose File'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                        {uploadedFileName && (
                          <span className="text-sm text-green-600">{uploadedFileName}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Max 5MB. Supported: JPEG, PNG, GIF, WebP
                      </p>
                      {formData.banner_url && bannerType === 'upload' && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Preview:</p>
                          <img
                            src={formData.banner_url}
                            alt="Banner preview"
                            className="max-w-xs rounded border"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Logo Display */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Branding</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.show_logo}
                  onChange={(e) => setFormData({ ...formData, show_logo: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Cognitive Kin logo on campaign page</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Display the Cognitive Kin logo at the top of your campaign landing page
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <a
              href="/admin"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
