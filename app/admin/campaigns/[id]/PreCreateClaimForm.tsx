'use client';

import { useState } from 'react';

interface PreCreateClaimFormProps {
  campaignId: string;
  campaignSlug: string;
}

export default function PreCreateClaimForm({ campaignId, campaignSlug }: PreCreateClaimFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [claimUrl, setClaimUrl] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    title: '',
    phone: '',
    admin_notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/pre-create-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create claim');
      }

      setSuccess(true);
      setClaimUrl(data.claimUrl);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        company: '',
        title: '',
        phone: '',
        admin_notes: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(claimUrl);
    alert('URL copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pre-Create Claim</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add a person in advance with prefilled info. They&apos;ll get a unique URL to complete their address.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setSuccess(false);
            setError('');
          }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Pre-Create Claim'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && claimUrl && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 font-medium mb-2">Claim pre-created successfully!</p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={claimUrl}
              className="flex-1 px-3 py-2 border border-green-300 rounded bg-white text-sm"
            />
            <button
              onClick={copyUrl}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
            >
              Copy URL
            </button>
          </div>
          <p className="text-xs text-green-700 mt-2">
            Share this URL with the person. They can fill in their address when ready.
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name (optional)
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name (optional)
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (optional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">If provided, will be prefilled but they can change it</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company (optional)
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (optional)
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Notes (private - not visible to user)
            </label>
            <textarea
              name="admin_notes"
              value={formData.admin_notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any internal notes about this claim..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create & Get URL'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
