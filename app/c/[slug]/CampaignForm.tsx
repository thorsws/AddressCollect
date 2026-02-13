'use client';

import { useState } from 'react';
import RichContent from '@/components/RichContent';

const DEFAULT_CONSENT_TEXT = 'I consent to providing my information for this campaign. I understand my data will be used solely for this purpose, stored securely, and deleted within 60 days. I can request deletion at any time by contacting the organizer.';

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
  kiosk_mode: boolean;
  questions_intro_text: string | null;
  contact_email: string | null;
  consent_text: string | null;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'checkboxes';
  is_required: boolean;
  options: string[] | null;
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
  inviteCode: '',
};

interface Props {
  campaign: Campaign;
  questions?: Question[];
  notYetStarted?: boolean;
  globalDefaults?: Record<string, string>;
}

export default function CampaignForm({ campaign, questions = [], notYetStarted = false, globalDefaults = {} }: Props) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);

  const resetForm = () => {
    setFormData(initialFormData);
    setAnswers({});
    setOtherText({});
    setSuccess(false);
    setRequiresVerification(false);
    setError('');
  };

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

    // Check if campaign hasn't started yet
    if (notYetStarted) {
      setError('This campaign has not started yet. Please check back later.');
      setLoading(false);
      return;
    }

    // Validate consent
    if (!consent) {
      setError('Please agree to the terms and data collection to continue');
      setLoading(false);
      return;
    }

    // Validate required questions
    for (const q of questions) {
      const answer = answers[q.id];
      const isEmpty = Array.isArray(answer)
        ? answer.length === 0
        : !answer?.trim();

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
        body: JSON.stringify({ ...formData, answers, consent }),
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
          {requiresVerification ? 'Check Your Email' : 'Thank You!'}
        </h2>
        <p className="text-gray-600 mb-4">
          {requiresVerification
            ? 'Please check your email and click the verification link to confirm your claim.'
            : "Your submission has been received. We'll be in touch soon!"}
        </p>
        {campaign.kiosk_mode && (
          <button
            onClick={resetForm}
            className="mt-6 bg-blue-600 text-white py-3 px-8 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Submit Another Entry
          </button>
        )}
      </div>
    );
  }

  return (
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
            Email {campaign.require_email && <span className="text-red-500">*</span>}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required={campaign.require_email}
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

      {campaign.require_invite_code && (
        <div>
          <label htmlFor="inviteCode" className="block text-base font-semibold text-gray-700 mb-2">
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
                {q.question_type === 'text' ? (
                  <input
                    type="text"
                    value={(answers[q.id] as string) || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : q.question_type === 'multiple_choice' ? (
                  <div className="space-y-3">
                    {q.options?.map((option) => (
                      <div key={option}>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={option}
                            checked={answers[q.id] === option || (option === 'Other' && (answers[q.id] as string)?.startsWith('Other: '))}
                            onChange={(e) => {
                              if (option === 'Other') {
                                setAnswers({ ...answers, [q.id]: `Other: ${otherText[q.id] || ''}` });
                              } else {
                                setAnswers({ ...answers, [q.id]: e.target.value });
                              }
                            }}
                            className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 flex-shrink-0"
                          />
                          <span className="ml-3 text-base text-gray-700">{option}</span>
                        </label>
                        {option === 'Other' && (answers[q.id] === 'Other' || (answers[q.id] as string)?.startsWith('Other: ')) && (
                          <input
                            type="text"
                            placeholder="Please specify..."
                            value={otherText[q.id] || ''}
                            onChange={(e) => {
                              setOtherText({ ...otherText, [q.id]: e.target.value });
                              setAnswers({ ...answers, [q.id]: `Other: ${e.target.value}` });
                            }}
                            className="mt-2 ml-8 w-full max-w-md px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {q.options?.map((option) => {
                      const selectedOptions = (answers[q.id] as string[]) || [];
                      const isOtherSelected = selectedOptions.some(o => o === 'Other' || o.startsWith('Other: '));
                      return (
                        <div key={option}>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              value={option}
                              checked={option === 'Other' ? isOtherSelected : selectedOptions.includes(option)}
                              onChange={(e) => {
                                const current = (answers[q.id] as string[]) || [];
                                let updated: string[];
                                if (option === 'Other') {
                                  if (e.target.checked) {
                                    updated = [...current.filter(o => !o.startsWith('Other')), otherText[q.id] ? `Other: ${otherText[q.id]}` : 'Other'];
                                  } else {
                                    updated = current.filter(o => !o.startsWith('Other'));
                                    setOtherText({ ...otherText, [q.id]: '' });
                                  }
                                } else {
                                  updated = e.target.checked
                                    ? [...current, option]
                                    : current.filter(o => o !== option);
                                }
                                setAnswers({ ...answers, [q.id]: updated });
                              }}
                              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                            />
                            <span className="ml-3 text-base text-gray-700">{option}</span>
                          </label>
                          {option === 'Other' && isOtherSelected && (
                            <input
                              type="text"
                              placeholder="Please specify..."
                              value={otherText[q.id] || ''}
                              onChange={(e) => {
                                setOtherText({ ...otherText, [q.id]: e.target.value });
                                const current = (answers[q.id] as string[]) || [];
                                const updated = current.filter(o => !o.startsWith('Other'));
                                updated.push(e.target.value ? `Other: ${e.target.value}` : 'Other');
                                setAnswers({ ...answers, [q.id]: updated });
                              }}
                              className="mt-2 ml-8 w-full max-w-md px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          )}
                        </div>
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
        disabled={loading || notYetStarted}
        className={`w-full py-4 px-6 rounded-md text-lg font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed transition-colors ${
          notYetStarted
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50'
        }`}
      >
        {loading ? 'Submitting...' : notYetStarted ? 'Submissions Not Yet Open' : 'Claim Your Book'}
      </button>
    </form>
  );
}
