'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QRCode from 'qrcode';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditor';
import ConfirmDialog from '@/components/ConfirmDialog';

interface GiftCode {
  id: string;
  code: string;
  label: string;
  custom_message: string | null;
  show_name: boolean;
  show_linkedin: boolean;
  show_bio: boolean;
  show_phone: boolean;
  show_email: boolean;
  custom_display_name: string | null;
  created_at: string;
}

interface Profile {
  displayName: string;
  email: string | null;
  linkedinUrl: string | null;
  bio: string | null;
  phone: string | null;
}

interface FormData {
  label: string;
  custom_message: string;
  show_name: boolean;
  show_linkedin: boolean;
  show_bio: boolean;
  show_phone: boolean;
  show_email: boolean;
  custom_display_name: string;
}

const defaultFormData: FormData = {
  label: '',
  custom_message: '',
  show_name: true,
  show_linkedin: true,
  show_bio: false,
  show_phone: false,
  show_email: false,
  custom_display_name: '',
};

export default function MyQRCodesPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [campaignSlug, setCampaignSlug] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // For creating/editing
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  // For QR display
  const [selectedCode, setSelectedCode] = useState<GiftCode | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; codeId: string }>({ isOpen: false, codeId: '' });

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || '';

  useEffect(() => {
    fetchCodes();
  }, [campaignId]);

  useEffect(() => {
    if (selectedCode) {
      generateQR(selectedCode.code);
    }
  }, [selectedCode]);

  async function fetchCodes() {
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/my-gift-code`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCodes(data.codes);
      setCampaignSlug(data.campaignSlug);
      setCampaignTitle(data.campaignTitle);
      setProfile(data.profile);

      // Update selectedCode with fresh data, or select first code
      if (data.codes.length > 0) {
        if (selectedCode) {
          // Find the updated version of the currently selected code
          const updated = data.codes.find((c: GiftCode) => c.id === selectedCode.id);
          setSelectedCode(updated || data.codes[0]);
        } else {
          setSelectedCode(data.codes[0]);
        }
      }
    } catch (err) {
      setError('Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  }

  async function generateQR(code: string) {
    const url = `${baseUrl}/c/${campaignSlug}/gift/${code}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        color: { dark: '#000', light: '#fff' },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = `/api/admin/campaigns/${campaignId}/my-gift-code`;
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { code_id: editingId, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(defaultFormData);
      await fetchCodes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(codeId: string) {
    setDeleteConfirm({ isOpen: true, codeId });
  }

  async function confirmDelete() {
    const codeId = deleteConfirm.codeId;
    setDeleteConfirm({ isOpen: false, codeId: '' });

    try {
      const res = await fetch(
        `/api/admin/campaigns/${campaignId}/my-gift-code?code_id=${codeId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to delete');
      if (selectedCode?.id === codeId) {
        setSelectedCode(null);
        setQrDataUrl(null);
      }
      await fetchCodes();
    } catch (err) {
      alert('Failed to delete');
    }
  }

  function startEdit(code: GiftCode) {
    setFormData({
      label: code.label || '',
      custom_message: code.custom_message || '',
      show_name: code.show_name,
      show_linkedin: code.show_linkedin,
      show_bio: code.show_bio,
      show_phone: code.show_phone,
      show_email: code.show_email,
      custom_display_name: code.custom_display_name || '',
    });
    setEditingId(code.id);
    setShowForm(true);
  }

  function handleCopyLink() {
    if (!selectedCode) return;
    const url = `${baseUrl}/c/${campaignSlug}/gift/${selectedCode.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    if (!selectedCode) return;
    const url = `${baseUrl}/c/${campaignSlug}/gift/${selectedCode.code}`;
    if (navigator.share) {
      navigator.share({
        title: `Gift: ${campaignTitle}`,
        text: selectedCode.custom_message || `Claim your book from ${profile?.displayName}`,
        url,
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">My QR Codes</h1>
              <p className="text-sm text-gray-600">{campaignTitle}</p>
            </div>
            <Link
              href={`/admin/campaigns/${campaignId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Back
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: List of codes */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your QR Codes</h2>
              <button
                onClick={() => {
                  setFormData(defaultFormData);
                  setEditingId(null);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
              >
                + Create New
              </button>
            </div>

            {codes.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No QR codes yet. Create one to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {codes.map((code) => (
                  <div
                    key={code.id}
                    className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${
                      selectedCode?.id === code.id
                        ? 'ring-2 ring-blue-500'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedCode(code)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{code.label}</h3>
                        {code.custom_message && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            "{code.custom_message}"
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {code.show_name && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Name</span>
                          )}
                          {code.show_linkedin && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">LinkedIn</span>
                          )}
                          {code.show_bio && (
                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">Bio</span>
                          )}
                          {code.show_phone && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">Phone</span>
                          )}
                          {code.show_email && (
                            <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded">Email</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(code);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(code.id);
                          }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: QR Preview or Create Form */}
          <div>
            {showForm ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingId ? 'Edit QR Code' : 'Create QR Code'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label (for your reference)
                    </label>
                    <input
                      type="text"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="e.g., Conference booth, LinkedIn version"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Message (shown to recipient)
                    </label>
                    <RichTextEditor
                      value={formData.custom_message}
                      onChange={(value) => setFormData({ ...formData, custom_message: value })}
                      placeholder="e.g., Great meeting you at the conference!"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Display Name (optional override)
                    </label>
                    <input
                      type="text"
                      value={formData.custom_display_name}
                      onChange={(e) => setFormData({ ...formData, custom_display_name: e.target.value })}
                      placeholder={profile?.displayName || 'Leave empty to use profile name'}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What to show recipient:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.show_name}
                          onChange={(e) => setFormData({ ...formData, show_name: e.target.checked })}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Your Name</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.show_linkedin}
                          onChange={(e) => setFormData({ ...formData, show_linkedin: e.target.checked })}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">LinkedIn Profile</span>
                        {!profile?.linkedinUrl && (
                          <span className="ml-2 text-xs text-orange-600">(not set in profile)</span>
                        )}
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.show_bio}
                          onChange={(e) => setFormData({ ...formData, show_bio: e.target.checked })}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Bio</span>
                        {!profile?.bio && (
                          <span className="ml-2 text-xs text-orange-600">(not set in profile)</span>
                        )}
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.show_phone}
                          onChange={(e) => setFormData({ ...formData, show_phone: e.target.checked })}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Phone Number</span>
                        {!profile?.phone && (
                          <span className="ml-2 text-xs text-orange-600">(not set in profile)</span>
                        )}
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.show_email}
                          onChange={(e) => setFormData({ ...formData, show_email: e.target.checked })}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Email Address</span>
                      </label>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Recipient will see:</h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 min-h-[60px]">
                      {formData.show_name && (
                        <p className="text-purple-900 font-semibold">
                          A gift from {formData.custom_display_name || profile?.displayName || 'Your Name'}
                        </p>
                      )}
                      {formData.custom_message && (
                        <p className="text-purple-800 text-sm mt-2 italic">
                          &ldquo;{formData.custom_message}&rdquo;
                        </p>
                      )}
                      {formData.show_bio && profile?.bio && (
                        <p className="text-purple-700 text-sm mt-2">{profile.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {formData.show_linkedin && profile?.linkedinUrl && (
                          <span className="text-purple-700 text-sm">Connect on LinkedIn →</span>
                        )}
                        {formData.show_email && profile?.email && (
                          <span className="text-purple-700 text-sm">{profile.email}</span>
                        )}
                        {formData.show_phone && profile?.phone && (
                          <span className="text-purple-700 text-sm">{profile.phone}</span>
                        )}
                      </div>
                      {!formData.show_name && !formData.custom_message && !formData.show_bio && !formData.show_linkedin && !formData.show_email && !formData.show_phone && (
                        <p className="text-gray-400 text-sm italic">Nothing selected to display</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create QR Code'}
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedCode ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{selectedCode.label}</h2>

                {qrDataUrl && (
                  <div className="flex justify-center my-4">
                    <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
                  </div>
                )}

                <div className="text-xs text-gray-500 text-center break-all mb-4">
                  {baseUrl}/c/{campaignSlug}/gift/{selectedCode.code}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={handleShare}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Share
                    </button>
                  )}
                </div>

                {/* Preview what recipient sees */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Recipient will see:</h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 min-h-[60px]">
                    {selectedCode.show_name && (
                      <p className="text-purple-900 font-semibold">
                        A gift from {selectedCode.custom_display_name || profile?.displayName}
                      </p>
                    )}
                    {selectedCode.custom_message && (
                      <p className="text-purple-800 text-sm mt-2 italic">
                        &ldquo;{selectedCode.custom_message}&rdquo;
                      </p>
                    )}
                    {selectedCode.show_bio && profile?.bio && (
                      <p className="text-purple-700 text-sm mt-2">{profile.bio}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {selectedCode.show_linkedin && profile?.linkedinUrl && (
                        <a href={profile.linkedinUrl} className="text-purple-700 text-sm hover:underline">
                          Connect on LinkedIn →
                        </a>
                      )}
                      {selectedCode.show_email && profile?.email && (
                        <span className="text-purple-700 text-sm">{profile.email}</span>
                      )}
                      {selectedCode.show_phone && profile?.phone && (
                        <span className="text-purple-700 text-sm">{profile.phone}</span>
                      )}
                    </div>
                    {!selectedCode.show_name && !selectedCode.custom_message && !selectedCode.show_bio && !selectedCode.show_linkedin && !selectedCode.show_email && !selectedCode.show_phone && (
                      <p className="text-gray-400 text-sm italic">Nothing selected to display. Edit this code to add content.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Select a QR code to preview, or create a new one.
              </div>
            )}

            {/* Link to profile settings */}
            <div className="mt-4 text-center">
              <Link href="/admin/settings" className="text-sm text-blue-600 hover:underline">
                Edit Profile Settings →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete QR Code"
        message="Delete this QR code? The link will stop working."
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, codeId: '' })}
      />
    </div>
  );
}
