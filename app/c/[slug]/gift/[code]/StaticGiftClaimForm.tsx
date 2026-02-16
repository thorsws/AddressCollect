'use client';

import { useState } from 'react';
import RichContent from '@/components/RichContent';

const DEFAULT_CONSENT_TEXT = 'I consent to providing my information for this campaign. I understand my data will be used solely for this purpose, stored securely, and deleted within 60 days. I can request deletion at any time by contacting the organizer.';

interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  require_email: boolean;
  require_email_verification: boolean;
  collect_company: boolean;
  collect_phone: boolean;
  collect_title: boolean;
  privacy_blurb: string | null;
  show_privacy_blurb: boolean;
  contact_email: string | null;
  contact_text: string | null;
  consent_text: string | null;
  show_logo: boolean;
  show_banner: boolean;
  banner_url: string | null;
  questions_intro_text: string | null;
}

interface GifterInfo {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  bio: string | null;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'checkboxes';
  is_required: boolean;
  options: string[] | null;
}

interface Props {
  campaign: Campaign;
  gifterInfo: GifterInfo;
  customMessage: string | null;
  questions: Question[];
  globalDefaults: Record<string, string>;
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
}

const initialFormData: FormData = {
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
};

export default function StaticGiftClaimForm({ campaign, gifterInfo, customMessage, questions, globalDefaults }: Props) {
  // Check if we have any gifter info to show
  const hasGifterInfo = gifterInfo.name || gifterInfo.linkedinUrl || gifterInfo.bio || gifterInfo.email || gifterInfo.phone || customMessage;
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [consent, setConsent] = useState(false);
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

    if (!consent) {
      setError('Please agree to the terms and data collection to continue');
      setLoading(false);
      return;
    }

    // Validate required questions
    for (const q of questions) {
      const answer = answers[q.id];
      const isEmpty = Array.isArray(answer) ? answer.length === 0 : !answer?.trim();
      if (q.is_required && isEmpty) {
        setError(`Please answer: ${q.question_text}`);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/campaigns/${campaign.slug}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          answers,
          consent,
          gifted_by: gifterInfo.id, // Associate with gifter
        }),
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
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        {campaign.show_logo && (
          <div className="mb-6 flex justify-center">
            <img src="/cognitive-kin-logo.svg" alt="Cognitive Kin" className="h-12 w-auto" />
          </div>
        )}
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {requiresVerification ? 'Check Your Email' : 'Thank You!'}
        </h2>
        <p className="text-gray-600 mb-4">
          {requiresVerification
            ? 'Please check your email and click the verification link to confirm your claim.'
            : "Your submission has been received. We'll be in touch soon!"}
        </p>

        {/* Show gifter info in success state */}
        {hasGifterInfo && (
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4 text-left">
            {gifterInfo.name && (
              <p className="text-purple-900 font-semibold">
                A gift from {gifterInfo.name}
              </p>
            )}
            {customMessage && (
              <p className="text-purple-800 mt-2 italic">&ldquo;{customMessage}&rdquo;</p>
            )}
            {gifterInfo.linkedinUrl && (
              <a
                href={gifterInfo.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-700 text-sm hover:underline block mt-2"
              >
                Connect on LinkedIn →
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 md:p-10">
      {campaign.show_logo && (
        <div className="mb-6 flex justify-center">
          <img src="/cognitive-kin-logo.svg" alt="Cognitive Kin" className="h-12 w-auto" />
        </div>
      )}

      {/* Gifter Info Box - only show if there's any info to display */}
      {hasGifterInfo && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 mb-6">
          {gifterInfo.name && (
            <p className="text-purple-900 font-semibold text-lg">
              A gift from {gifterInfo.name}
            </p>
          )}
          {customMessage && (
            <p className="text-purple-800 mt-2 italic">&ldquo;{customMessage}&rdquo;</p>
          )}
          {gifterInfo.bio && (
            <p className="text-purple-700 text-sm mt-2">{gifterInfo.bio}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-3">
            {gifterInfo.linkedinUrl && (
              <a
                href={gifterInfo.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-700 text-sm hover:underline"
              >
                Connect on LinkedIn →
              </a>
            )}
            {gifterInfo.email && (
              <a
                href={`mailto:${gifterInfo.email}`}
                className="text-purple-700 text-sm hover:underline"
              >
                {gifterInfo.email}
              </a>
            )}
            {gifterInfo.phone && (
              <span className="text-purple-700 text-sm">
                {gifterInfo.phone}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mb-8">
        <RichContent
          content={campaign.title}
          className="campaign-title font-bold text-gray-900 mb-4 sm:mb-6"
        />
        {campaign.description && (
          <RichContent
            content={campaign.description}
            className="text-gray-700 mb-6 prose prose-base sm:prose-lg max-w-none"
          />
        )}

        {campaign.show_privacy_blurb !== false && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <h3 className="text-green-900 font-bold text-lg mb-2">Privacy Promise</h3>
            <RichContent
              content={campaign.privacy_blurb || globalDefaults['default_privacy_blurb'] || "We only use your address to ship the book. We won't sell your information."}
              className="text-green-800 text-base font-medium"
            />
          </div>
        )}

        {campaign.contact_email && (
          <div className="text-gray-700 text-base mt-4">
            <RichContent
              content={campaign.contact_text || 'If you have any questions, please email'}
              className="inline"
            />{' '}
            <a
              href={`mailto:${campaign.contact_email}`}
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              {campaign.contact_email}
            </a>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-base font-semibold text-gray-700 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
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
              id="lastName"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {campaign.require_email && (
          <div>
            <label htmlFor="email" className="block text-base font-semibold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {campaign.collect_company && (
          <div>
            <label htmlFor="company" className="block text-base font-semibold text-gray-700 mb-2">
              Company / Organization
            </label>
            <input
              type="text"
              id="company"
              name="company"
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
              id="title"
              name="title"
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
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="border-t pt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="address1" className="block text-base font-semibold text-gray-700 mb-2">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address1"
                name="address1"
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
                id="address2"
                name="address2"
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
                  id="city"
                  name="city"
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
                  id="region"
                  name="region"
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
                  id="postalCode"
                  name="postalCode"
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

        {/* Custom Questions */}
        {questions.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Help Us Learn More</h3>
            {campaign.questions_intro_text && (
              <p className="text-gray-700 text-base mb-6">{campaign.questions_intro_text}</p>
            )}
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id}>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    {q.question_text} {q.is_required && <span className="text-red-500">*</span>}
                  </label>
                  {q.question_type === 'text' && (
                    <input
                      type="text"
                      value={(answers[q.id] as string) || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  {q.question_type === 'multiple_choice' && (
                    <div className="space-y-3">
                      {q.options?.map((option) => (
                        <label key={option} className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={option}
                            checked={answers[q.id] === option}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-3 text-base text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.question_type === 'checkboxes' && (
                    <div className="space-y-3">
                      {q.options?.map((option) => {
                        const selectedOptions = (answers[q.id] as string[]) || [];
                        return (
                          <label key={option} className="flex items-center">
                            <input
                              type="checkbox"
                              value={option}
                              checked={selectedOptions.includes(option)}
                              onChange={(e) => {
                                const current = (answers[q.id] as string[]) || [];
                                const updated = e.target.checked
                                  ? [...current, option]
                                  : current.filter(o => o !== option);
                                setAnswers({ ...answers, [q.id]: updated });
                              }}
                              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-3 text-base text-gray-700">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
              <RichContent
                content={campaign.consent_text || globalDefaults['default_consent_text'] || DEFAULT_CONSENT_TEXT}
                className="inline"
              />
              {' '}<span className="text-red-500">*</span>
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-base font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-md text-lg font-bold bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Claim Your Book'}
        </button>
      </form>
    </div>
  );
}
