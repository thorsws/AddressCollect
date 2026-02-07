'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'checkboxes';
  is_required: boolean;
  options: string[];
}

export default function CreateCampaign() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [unlimitedCapacity, setUnlimitedCapacity] = useState(false);
  const [bannerType, setBannerType] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'text' as 'text' | 'multiple_choice' | 'checkboxes',
    is_required: false,
    options: ['', ''],
  });

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    internal_title: '',
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
    enable_questions: false,
    questions_intro_text: '',
    privacy_blurb: "Your information is used solely for this giveaway. We collect only what's needed to ship your book. Your data is stored securely, never sold or shared, and will be deleted within 60 days after books are shipped. We don't use cookies or tracking. Contact us anytime to request data deletion.",
    max_claims_per_email: 1,
    max_claims_per_ip_per_day: 5,
    test_mode: false,
    show_banner: true,
    banner_url: 'https://cognitivekin.com',
    show_logo: false,
    contact_email: '',
    contact_text: 'If you have any questions, please email',
    notes: '',
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

  // Question management functions
  const addQuestion = () => {
    if (!newQuestion.question_text.trim()) return;

    const needsOptions = newQuestion.question_type === 'multiple_choice' || newQuestion.question_type === 'checkboxes';
    const options = needsOptions
      ? newQuestion.options.filter(o => o.trim())
      : [];

    if (needsOptions && options.length < 2) {
      alert('Multiple choice and checkbox questions need at least 2 options');
      return;
    }

    const question: Question = {
      id: Math.random().toString(36).substr(2, 9),
      question_text: newQuestion.question_text,
      question_type: newQuestion.question_type,
      is_required: newQuestion.is_required,
      options,
    };

    setQuestions([...questions, question]);
    setNewQuestion({
      question_text: '',
      question_type: 'text',
      is_required: false,
      options: ['', ''],
    });
    setIsAddingQuestion(false);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, ''],
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length <= 2) return;
    const newOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create campaign first
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

      const { campaign } = await response.json();

      // If questions are enabled and there are questions, create them
      if (formData.enable_questions && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await fetch(`/api/admin/campaigns/${campaign.id}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question_text: q.question_text,
              question_type: q.question_type,
              is_required: q.is_required,
              options: q.options.length > 0 ? q.options : null,
            }),
          });
        }
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
                  Internal Campaign Title * <span className="text-gray-500 text-xs">(Admin only)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.internal_title}
                  onChange={(e) => setFormData({ ...formData, internal_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Stanford Book - Spring 2026"
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
                  placeholder="Stanford Book Giveaway"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This title is shown on the public campaign page
                </p>
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
                Add custom questions to collect additional information from users
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
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-md font-medium text-gray-900">Questions ({questions.length})</h3>
                      {!isAddingQuestion && (
                        <button
                          type="button"
                          onClick={() => setIsAddingQuestion(true)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          + Add Question
                        </button>
                      )}
                    </div>

                    {/* Existing Questions */}
                    {questions.length === 0 && !isAddingQuestion && (
                      <p className="text-gray-500 text-sm">No questions yet. Click &quot;Add Question&quot; to get started.</p>
                    )}

                    <div className="space-y-3">
                      {questions.map((q, index) => (
                        <div key={q.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                                <span className={`px-2 py-0.5 text-xs rounded ${
                                  q.question_type === 'text'
                                    ? 'bg-gray-100 text-gray-600'
                                    : q.question_type === 'multiple_choice'
                                    ? 'bg-purple-100 text-purple-600'
                                    : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {q.question_type === 'text'
                                    ? 'Text'
                                    : q.question_type === 'multiple_choice'
                                    ? 'Multiple Choice'
                                    : 'Checkboxes'}
                                </span>
                                {q.is_required && (
                                  <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded">Required</span>
                                )}
                              </div>
                              <p className="text-gray-900 text-sm">{q.question_text}</p>
                              {q.options && q.options.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {q.options.map((opt, i) => (
                                    <span key={i} className="px-2 py-0.5 text-xs bg-white text-gray-700 rounded border border-gray-200">
                                      {opt}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteQuestion(q.id)}
                              className="text-red-600 hover:text-red-700 text-sm ml-2"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Question Form */}
                    {isAddingQuestion && (
                      <div className="mt-4 border border-blue-200 rounded-lg p-4 bg-blue-50">
                        <h4 className="font-medium text-gray-900 mb-3 text-sm">New Question</h4>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                            <select
                              value={newQuestion.question_type}
                              onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value as 'text' | 'multiple_choice' | 'checkboxes' })}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="text">Free Text</option>
                              <option value="multiple_choice">Multiple Choice (select one)</option>
                              <option value="checkboxes">Checkboxes (select multiple)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                            <input
                              type="text"
                              value={newQuestion.question_text}
                              onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                              placeholder="Enter your question..."
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {(newQuestion.question_type === 'multiple_choice' || newQuestion.question_type === 'checkboxes') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                              <div className="space-y-2">
                                {newQuestion.options.map((opt, index) => (
                                  <div key={index} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => updateOption(index, e.target.value)}
                                      placeholder={`Option ${index + 1}`}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    {newQuestion.options.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => removeOption(index)}
                                        className="text-red-600 hover:text-red-700 px-2"
                                      >
                                        &times;
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={addOption}
                                  className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                  + Add Option
                                </button>
                              </div>
                            </div>
                          )}

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newQuestion.is_required}
                              onChange={(e) => setNewQuestion({ ...newQuestion, is_required: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Required question</span>
                          </label>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={addQuestion}
                              disabled={!newQuestion.question_text.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                              Add Question
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsAddingQuestion(false)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-700 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
