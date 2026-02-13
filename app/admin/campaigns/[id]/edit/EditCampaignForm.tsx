'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { utcToEastern, easternToUtc } from '@/lib/utils/timezone';

const QuestionsManager = dynamic(() => import('../QuestionsManager'), { ssr: false });
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-500 animate-pulse min-h-[80px]">Loading editor...</div>
});

interface Campaign {
  id: string;
  slug: string;
  title: string;
  internal_title: string;
  description: string | null;
  capacity_total: number | null;
  is_active: boolean;
  require_email: boolean;
  require_email_verification: boolean;
  require_invite_code: boolean;
  show_scarcity: boolean;
  collect_company: boolean;
  collect_phone: boolean;
  collect_title: boolean;
  collect_linkedin: boolean;
  enable_questions: boolean;
  questions_intro_text: string | null;
  privacy_blurb: string | null;
  show_privacy_blurb: boolean;
  max_claims_per_email: number;
  max_claims_per_ip_per_day: number;
  max_claims_per_address: number;
  test_mode: boolean;
  show_banner: boolean;
  banner_url: string | null;
  show_logo: boolean;
  show_feature_section: boolean;
  feature_image_url: string | null;
  feature_paragraph: string | null;
  contact_email: string | null;
  contact_text: string | null;
  consent_text: string | null;
  kiosk_mode: boolean;
  starts_at: string | null;
  ends_at: string | null;
  notes: string | null;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'checkboxes';
  is_required: boolean;
  display_order: number;
  options: string[] | null;
}

interface Props {
  campaign: Campaign;
  initialQuestions: Question[];
  globalDefaults?: Record<string, string>;
}

export default function EditCampaignForm({ campaign, initialQuestions, globalDefaults = {} }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unlimitedCapacity, setUnlimitedCapacity] = useState(!campaign.capacity_total);
  const [changeSummary, setChangeSummary] = useState('');

  const [uploadingFeatureImage, setUploadingFeatureImage] = useState(false);

  const [formData, setFormData] = useState({
    title: campaign.title,
    internal_title: campaign.internal_title,
    description: campaign.description || '',
    capacity_total: campaign.capacity_total || 100,
    is_active: campaign.is_active,
    require_email: campaign.require_email,
    require_email_verification: campaign.require_email_verification,
    require_invite_code: campaign.require_invite_code,
    show_scarcity: campaign.show_scarcity,
    collect_company: campaign.collect_company,
    collect_phone: campaign.collect_phone,
    collect_title: campaign.collect_title,
    collect_linkedin: campaign.collect_linkedin || false,
    enable_questions: campaign.enable_questions,
    questions_intro_text: campaign.questions_intro_text || '',
    privacy_blurb: campaign.privacy_blurb || '',
    show_privacy_blurb: campaign.show_privacy_blurb !== false,
    max_claims_per_email: campaign.max_claims_per_email,
    max_claims_per_ip_per_day: campaign.max_claims_per_ip_per_day,
    max_claims_per_address: campaign.max_claims_per_address || 1,
    test_mode: campaign.test_mode,
    show_banner: campaign.show_banner,
    show_logo: campaign.show_logo,
    banner_url: campaign.banner_url || '',
    show_feature_section: campaign.show_feature_section || false,
    feature_image_url: campaign.feature_image_url || '',
    feature_paragraph: campaign.feature_paragraph || '',
    contact_email: campaign.contact_email || '',
    contact_text: campaign.contact_text || 'If you have any questions, please email',
    consent_text: campaign.consent_text || 'I consent to providing my information for this campaign. I understand my data will be used solely for this purpose, stored securely, and deleted within 60 days. I can request deletion at any time by contacting the organizer.',
    kiosk_mode: campaign.kiosk_mode,
    starts_at: campaign.starts_at ? utcToEastern(campaign.starts_at) : '',
    ends_at: campaign.ends_at ? utcToEastern(campaign.ends_at) : '',
    notes: campaign.notes || '',
  });

  const handleFeatureImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFeatureImage(true);
    setError('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const result = await response.json();
      setFormData(prev => ({ ...prev, feature_image_url: result.url }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setUploadingFeatureImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    if (saveAsDraft) {
      setSavingDraft(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      // Convert datetime values from Eastern to UTC before sending
      const dataToSend = {
        ...formData,
        slug: campaign.slug, // Include slug for versioning
        capacity_total: unlimitedCapacity ? 0 : formData.capacity_total,
        starts_at: formData.starts_at ? easternToUtc(formData.starts_at) : '',
        ends_at: formData.ends_at ? easternToUtc(formData.ends_at) : '',
        save_as_draft: saveAsDraft,
        change_summary: changeSummary || null,
      };

      const response = await fetch(`/api/admin/campaigns/${campaign.id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update campaign');
      }

      const result = await response.json();

      if (saveAsDraft) {
        // Show success message for draft save
        setSuccess('Draft saved! Changes are not yet live.');
        setSavingDraft(false);
      } else {
        // Redirect to campaign page after publishing
        router.push(`/admin/campaigns/${campaign.id}`);
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setLoading(false);
      setSavingDraft(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:h-16 sm:py-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Edit Campaign</h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{campaign.slug}</p>
            </div>
            <a
              href={`/admin/campaigns/${campaign.id}`}
              className="flex items-center text-blue-600 hover:text-blue-700 ml-4 whitespace-nowrap bg-blue-50 sm:bg-transparent px-3 py-1.5 sm:px-0 sm:py-0 rounded-md"
            >
              <svg className="w-4 h-4 mr-1 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs sm:text-sm font-medium sm:font-normal">Back</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center justify-between">
              <span>{success}</span>
              <button
                type="button"
                onClick={() => setSuccess('')}
                className="text-green-700 hover:text-green-900 ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Campaign Title * <span className="text-gray-500 text-xs">(Admin only)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.internal_title}
                  onChange={(e) => setFormData({ ...formData, internal_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This title is only shown in the admin interface
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Campaign Title * <span className="text-gray-500 text-xs">(Shown to users)</span>
                </label>
                <RichTextEditor
                  value={formData.title}
                  onChange={(value) => setFormData({ ...formData, title: value })}
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This title is shown on the public campaign page
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug (cannot be changed)
                </label>
                <input
                  type="text"
                  disabled
                  value={campaign.slug}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use the toolbar to format text with bold, italic, links, and lists
                </p>
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

              {/* Campaign Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starts At (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter in Eastern Time (EST/EDT). Leave empty to start immediately</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ends At (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter in Eastern Time (EST/EDT). Leave empty for no end date</p>
                </div>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes (Internal Only)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Internal notes for this campaign (not visible to users)..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Private notes for admins only - will not be shown on the public campaign page
              </p>
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
                  checked={formData.show_logo}
                  onChange={(e) => setFormData({ ...formData, show_logo: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show logo on campaign page</span>
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

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.kiosk_mode}
                  onChange={(e) => setFormData({ ...formData, kiosk_mode: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Kiosk/iPad mode (show &quot;Submit Another&quot; button after submission)</span>
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

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.collect_linkedin}
                  onChange={(e) => setFormData({ ...formData, collect_linkedin: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Collect LinkedIn profile URL</span>
              </label>
            </div>
          </div>

          {/* Custom Questions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Questions</h2>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enable_questions}
                  onChange={(e) => setFormData({ ...formData, enable_questions: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable custom questions</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Collect additional information from users with custom questions
              </p>

              <div className="ml-6 space-y-3">
                {formData.enable_questions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Questions Section Intro Text (optional)
                    </label>
                    <RichTextEditor
                      value={formData.questions_intro_text}
                      onChange={(value) => setFormData({ ...formData, questions_intro_text: value })}
                      placeholder="Please help us learn more about your use of AI"
                      rows={2}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This text will appear above your questions to provide context to users
                    </p>
                  </div>
                )}
              </div>

              <div className={`mt-4 pl-6 border-l-2 ${formData.enable_questions ? 'border-blue-200' : 'border-gray-200'}`}>
                {!formData.enable_questions && (
                  <p className="text-xs text-amber-600 mb-3">
                    Questions are currently hidden from the public page. Enable above to show them.
                  </p>
                )}
                <QuestionsManager campaignId={campaign.id} initialQuestions={initialQuestions} />
              </div>
            </div>
          </div>

          {/* Privacy & Limits */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Rate Limits</h2>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.show_privacy_blurb}
                  onChange={(e) => setFormData({ ...formData, show_privacy_blurb: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show privacy blurb section</span>
              </label>

              {formData.show_privacy_blurb && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Privacy Blurb
                  </label>
                  <RichTextEditor
                    value={formData.privacy_blurb}
                    onChange={(value) => setFormData({ ...formData, privacy_blurb: value })}
                    rows={2}
                  />
                  {!formData.privacy_blurb && globalDefaults['default_privacy_blurb'] && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                      <p className="text-blue-800 font-medium">Using global default:</p>
                      <p className="text-blue-700 mt-1 line-clamp-3">
                        {globalDefaults['default_privacy_blurb']}
                      </p>
                      <a href="/admin/global-settings" className="text-blue-600 text-xs hover:underline mt-1 inline-block">
                        Edit global defaults →
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consent Checkbox Text
                </label>
                <RichTextEditor
                  value={formData.consent_text}
                  onChange={(value) => setFormData({ ...formData, consent_text: value })}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Text shown next to the required consent checkbox at the bottom of the form
                </p>
                {!formData.consent_text && globalDefaults['default_consent_text'] && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="text-blue-800 font-medium">Using global default:</p>
                    <p className="text-blue-700 mt-1 line-clamp-3">
                      {globalDefaults['default_consent_text']}
                    </p>
                    <a href="/admin/global-settings" className="text-blue-600 text-xs hover:underline mt-1 inline-block">
                      Edit global defaults →
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max people per address
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_claims_per_address}
                    onChange={(e) => setFormData({ ...formData, max_claims_per_address: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Roommates, family members, etc.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={!!formData.contact_email}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      setFormData({ ...formData, contact_email: '' });
                    } else {
                      setFormData({ ...formData, contact_email: formData.contact_email || 'jan.rosen@rallertechnologies.com' });
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show contact information on campaign page</span>
              </label>

              {formData.contact_email && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="support@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Text
                    </label>
                    <RichTextEditor
                      value={formData.contact_text}
                      onChange={(value) => setFormData({ ...formData, contact_text: value })}
                      rows={2}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The email address will be appended as a link after this text
                    </p>
                  </div>
                </>
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
              )}
            </div>
          </div>

          {/* Feature Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Section</h2>
            <p className="text-sm text-gray-600 mb-4">
              Display a featured image and paragraph after the logo - useful for featuring a client, testimonial, or promotional content.
            </p>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.show_feature_section}
                  onChange={(e) => setFormData({ ...formData, show_feature_section: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show feature section on campaign page</span>
              </label>

              {formData.show_feature_section && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feature Image
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.feature_image_url}
                        onChange={(e) => setFormData({ ...formData, feature_image_url: e.target.value })}
                        placeholder="https://example.com/client-photo.jpg"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <label className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer flex items-center gap-2 whitespace-nowrap disabled:opacity-50">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleFeatureImageUpload}
                          className="hidden"
                          disabled={uploadingFeatureImage}
                        />
                        {uploadingFeatureImage ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Upload
                          </>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload an image or paste a URL. Max 5MB (JPEG, PNG, GIF, WebP).
                    </p>
                    {formData.feature_image_url && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Preview:</p>
                        <img
                          src={formData.feature_image_url}
                          alt="Feature preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feature Paragraph
                    </label>
                    <RichTextEditor
                      value={formData.feature_paragraph}
                      onChange={(value) => setFormData({ ...formData, feature_paragraph: value })}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Text to display alongside the image (e.g., client testimonial, promotional message)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {/* Change Summary */}
          <div className="pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Change Summary <span className="text-gray-500 text-xs">(Optional - for version history)</span>
            </label>
            <input
              type="text"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="e.g., Updated privacy blurb, changed capacity"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <a
              href={`/admin/campaigns/${campaign.id}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </a>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading || savingDraft}
                className="px-4 py-2 border border-amber-500 text-amber-700 rounded hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingDraft ? 'Saving Draft...' : 'Save as Draft'}
              </button>
              <button
                type="submit"
                disabled={loading || savingDraft}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Publishing...' : 'Publish Changes'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
