'use client';

import { useState } from 'react';

interface Campaign {
  id: string;
  slug: string;
  title: string;
  require_email: boolean;
  require_email_verification: boolean;
  require_invite_code: boolean;
  collect_company: boolean;
  collect_phone: boolean;
  collect_title: boolean;
  test_mode: boolean;
}

interface PrefilledData {
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  address1: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  address2: string | null;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  inviteCode: string;
}

export default function TokenClaimForm({
  campaign,
  prefilledData,
  claimToken,
}: {
  campaign: Campaign;
  prefilledData: PrefilledData;
  claimToken: string;
}) {
  const [formData, setFormData] = useState<FormData>({
    firstName: prefilledData.first_name || '',
    lastName: prefilledData.last_name || '',
    email: prefilledData.email || '',
    company: prefilledData.company || '',
    title: prefilledData.title || '',
    phone: prefilledData.phone || '',
    address1: prefilledData.address1 || '',
    address2: prefilledData.address2 || '',
    city: prefilledData.city || '',
    region: prefilledData.region || '',
    postalCode: prefilledData.postal_code || '',
    country: prefilledData.country || 'US',
    inviteCode: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/campaigns/${campaign.slug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, claimToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit claim');
        setLoading(false);
        return;
      }

      setSuccess(true);
      if (data.requiresVerification) {
        setRequiresVerification(true);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Submitted!</h2>
        {requiresVerification ? (
          <p className="text-gray-600">
            Please check your email to verify your claim. The verification link will expire in 24 hours.
          </p>
        ) : (
          <p className="text-gray-600">
            Your claim has been confirmed. Thank you!
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            id="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name *
          </label>
          <input
            type="text"
            name="lastName"
            id="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>
      </div>

      {/* Email */}
      {campaign.require_email && (
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required={campaign.require_email}
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>
      )}

      {/* Optional Fields */}
      {campaign.collect_company && (
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">
            Company
          </label>
          <input
            type="text"
            name="company"
            id="company"
            value={formData.company}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>
      )}

      {campaign.collect_title && (
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>
      )}

      {campaign.collect_phone && (
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>
      )}

      {/* Address Fields */}
      <div>
        <label htmlFor="address1" className="block text-sm font-medium text-gray-700">
          Address Line 1 *
        </label>
        <input
          type="text"
          name="address1"
          id="address1"
          required
          value={formData.address1}
          onChange={handleChange}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
        />
      </div>

      <div>
        <label htmlFor="address2" className="block text-sm font-medium text-gray-700">
          Address Line 2
        </label>
        <input
          type="text"
          name="address2"
          id="address2"
          value={formData.address2}
          onChange={handleChange}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City *
          </label>
          <input
            type="text"
            name="city"
            id="city"
            required
            value={formData.city}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="region" className="block text-sm font-medium text-gray-700">
            State/Region *
          </label>
          <input
            type="text"
            name="region"
            id="region"
            required
            value={formData.region}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
            Postal Code *
          </label>
          <input
            type="text"
            name="postalCode"
            id="postalCode"
            required
            value={formData.postalCode}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
          />
        </div>
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
          Country *
        </label>
        <select
          name="country"
          id="country"
          required
          value={formData.country}
          onChange={handleChange}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
        </select>
      </div>

      {/* Invite Code */}
      {campaign.require_invite_code && (
        <div>
          <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700">
            Invite Code *
          </label>
          <input
            type="text"
            name="inviteCode"
            id="inviteCode"
            required={campaign.require_invite_code}
            value={formData.inviteCode}
            onChange={handleChange}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border uppercase"
          />
        </div>
      )}

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Claim'}
        </button>
      </div>
    </form>
  );
}
