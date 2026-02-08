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
  contact_email: string | null;
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
  onSuccess,
}: {
  campaign: Campaign;
  prefilledData: PrefilledData;
  claimToken: string;
  onSuccess?: (requiresVerification: boolean) => void;
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
  const [internalSuccess, setInternalSuccess] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [consent, setConsent] = useState(false);

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
        body: JSON.stringify({ ...formData, claimToken, consent }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit claim');
        setLoading(false);
        return;
      }

      if (onSuccess) {
        onSuccess(data.requiresVerification || false);
      } else {
        setInternalSuccess(true);
        if (data.requiresVerification) {
          setRequiresVerification(true);
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (internalSuccess) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-base font-semibold text-gray-700 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            id="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-base font-semibold text-gray-700 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            id="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Email */}
      {campaign.require_email && (
        <div>
          <label htmlFor="email" className="block text-base font-semibold text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required={campaign.require_email}
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Optional Fields */}
      {campaign.collect_company && (
        <div>
          <label htmlFor="company" className="block text-base font-semibold text-gray-700 mb-2">
            Company / Organization
          </label>
          <input
            type="text"
            name="company"
            id="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {campaign.collect_title && (
        <div>
          <label htmlFor="title" className="block text-base font-semibold text-gray-700 mb-2">
            Role / Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {campaign.collect_phone && (
        <div>
          <label htmlFor="phone" className="block text-base font-semibold text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Address Fields */}
      <div className="border-t pt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="address1" className="block text-base font-semibold text-gray-700 mb-2">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address1"
              id="address1"
              required
              value={formData.address1}
              onChange={handleChange}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="address2" className="block text-base font-semibold text-gray-700 mb-2">
              Apartment, Suite, etc. (optional)
            </label>
            <input
              type="text"
              name="address2"
              id="address2"
              value={formData.address2}
              onChange={handleChange}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-base font-semibold text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                id="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="region" className="block text-base font-semibold text-gray-700 mb-2">
                State / Province <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="region"
                id="region"
                required
                value={formData.region}
                onChange={handleChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="postalCode" className="block text-base font-semibold text-gray-700 mb-2">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="postalCode"
                id="postalCode"
                required
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-base font-semibold text-gray-700 mb-2">
                Country
              </label>
              <div className="w-full px-4 py-3 text-base border border-gray-200 rounded-md bg-gray-50 text-gray-700 font-medium">
                United States
              </div>
              <p className="text-sm text-gray-600 mt-2">
                We currently only ship within the USA.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Code */}
      {campaign.require_invite_code && (
        <div>
          <label htmlFor="inviteCode" className="block text-base font-semibold text-gray-700 mb-2">
            Invite Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="inviteCode"
            id="inviteCode"
            required={campaign.require_invite_code}
            value={formData.inviteCode}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
          />
        </div>
      )}

      {/* Consent Checkbox */}
      <div className="border-t pt-6">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
            required
          />
          <span className="ml-3 text-base text-gray-700 leading-relaxed">
            I consent to providing my information for <strong>{campaign.title}</strong>. I understand my data will be used solely for this purpose,
            stored securely, and deleted within 60 days. I can request deletion at any time by contacting{' '}
            {campaign.contact_email || 'the organizer'}.
            {' '}<span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !consent}
        className="w-full bg-blue-600 text-white py-4 px-6 rounded-md text-lg font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Submitting...' : 'Submit Claim'}
      </button>
    </form>
  );
}
