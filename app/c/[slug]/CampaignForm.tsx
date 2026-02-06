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
  show_banner: boolean;
  banner_url: string | null;
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

export default function CampaignForm({ campaign }: { campaign: Campaign }) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    title: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'US',
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
        body: JSON.stringify(formData),
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {requiresVerification ? 'Check Your Email' : "You're All Set!"}
        </h2>
        <p className="text-gray-600 mb-4">
          {requiresVerification
            ? 'Please check your email and click the verification link to confirm your claim.'
            : "Your claim has been confirmed. We'll ship your book soon!"}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {campaign.require_email && (
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email {campaign.require_email && <span className="text-red-500">*</span>}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required={campaign.require_email}
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {campaign.collect_company && (
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Company / Organization
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {campaign.collect_title && (
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Role / Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {campaign.collect_phone && (
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address1"
              name="address1"
              required
              value={formData.address1}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">
              Apartment, Suite, etc. (optional)
            </label>
            <input
              type="text"
              id="address2"
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                State / Province <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="region"
                name="region"
                required
                value={formData.region}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                required
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                id="country"
                name="country"
                required
                value={formData.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {campaign.require_invite_code && (
        <div>
          <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
            Invite Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="inviteCode"
            name="inviteCode"
            required={campaign.require_invite_code}
            value={formData.inviteCode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Submitting...' : 'Claim Your Book'}
      </button>
    </form>
  );
}
