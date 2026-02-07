'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import LogoToggle from '../LogoToggle';

const QuestionsManager = dynamic(() => import('../QuestionsManager'), { ssr: false });

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
  enable_questions: boolean;
  questions_intro_text: string | null;
  privacy_blurb: string | null;
  max_claims_per_email: number;
  max_claims_per_ip_per_day: number;
  test_mode: boolean;
  show_banner: boolean;
  banner_url: string | null;
  show_logo: boolean;
  contact_email: string | null;
  contact_text: string | null;
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
}

export default function EditCampaignForm({ campaign, initialQuestions }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unlimitedCapacity, setUnlimitedCapacity] = useState(!campaign.capacity_total);

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
    enable_questions: campaign.enable_questions,
    questions_intro_text: campaign.questions_intro_text || '',
    privacy_blurb: campaign.privacy_blurb || '',
    max_claims_per_email: campaign.max_claims_per_email,
    max_claims_per_ip_per_day: campaign.max_claims_per_ip_per_day,
    test_mode: campaign.test_mode,
    show_banner: campaign.show_banner,
    banner_url: campaign.banner_url || '',
    contact_email: campaign.contact_email || '',
    contact_text: campaign.contact_text || 'If you have any questions, please email',
    kiosk_mode: campaign.kiosk_mode,
    starts_at: campaign.starts_at ? campaign.starts_at.slice(0, 16) : '',
    ends_at: campaign.ends_at ? campaign.ends_at.slice(0, 16) : '',
    notes: campaign.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/campaigns/${campaign.id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity_total: unlimitedCapacity ? 0 : formData.capacity_total,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update campaign');
      }

      router.push(`/admin/campaigns/${campaign.id}`);
      router.refresh();
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
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Campaign</h1>
              <p className="text-sm text-gray-500">{campaign.slug}</p>
            </div>
            <div className="flex items-center space-x-4">
              <LogoToggle campaignId={campaign.id} initialValue={campaign.show_logo} />
              <a
                href={`/admin/campaigns/${campaign.id}`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                ← Back to Campaign
              </a>
            </div>
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
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              {formData.enable_questions && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Questions Section Intro Text (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.questions_intro_text}
                      onChange={(e) => setFormData({ ...formData, questions_intro_text: e.target.value })}
                      placeholder="Please help us learn more about your use of AI"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This text will appear above your questions to provide context to users
                    </p>
                  </div>
                </div>
              )}

              {formData.enable_questions && (
                <div className="mt-4 pl-6 border-l-2 border-blue-200">
                  <QuestionsManager campaignId={campaign.id} initialQuestions={initialQuestions} />
                </div>
              )}
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
                    <input
                      type="text"
                      value={formData.contact_text}
                      onChange={(e) => setFormData({ ...formData, contact_text: e.target.value })}
                      placeholder="If you have any questions, please email"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Preview: {formData.contact_text} <span className="text-blue-600">{formData.contact_email}</span>
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

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <a
              href={`/admin/campaigns/${campaign.id}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
