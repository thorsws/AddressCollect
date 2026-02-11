'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface GifterProfile {
  name: string;
  email: string;
  linkedinUrl: string | null;
  phone: string | null;
  bio: string | null;
}

interface Props {
  campaignId: string;
  campaignSlug: string;
  gifterProfile: GifterProfile;
}

interface GeneratedGift {
  claimUrl: string;
  qrDataUrl: string;
  recipientName: string;
}

interface VisibilitySettings {
  showEmail: boolean;
  showPhone: boolean;
  showLinkedIn: boolean;
  showBio: boolean;
}

const VISIBILITY_STORAGE_KEY = 'gift-visibility-settings';

function loadVisibilitySettings(): VisibilitySettings {
  if (typeof window === 'undefined') {
    return { showEmail: false, showPhone: false, showLinkedIn: true, showBio: false };
  }
  try {
    const stored = localStorage.getItem(VISIBILITY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parsing errors
  }
  return { showEmail: false, showPhone: false, showLinkedIn: true, showBio: false };
}

function saveVisibilitySettings(settings: VisibilitySettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export default function GiftGenerator({ campaignId, campaignSlug, gifterProfile }: Props) {
  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [noteToRecipient, setNoteToRecipient] = useState('');
  const [notePrivate, setNotePrivate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedGift, setGeneratedGift] = useState<GeneratedGift | null>(null);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [visibility, setVisibility] = useState<VisibilitySettings>(() => loadVisibilitySettings());

  // Check if Web Share API is available (on mount)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      setCanShare(true);
    }
  }, []);

  // Save visibility settings when they change
  useEffect(() => {
    saveVisibilitySettings(visibility);
  }, [visibility]);

  function updateVisibility(key: keyof VisibilitySettings, value: boolean) {
    setVisibility(prev => ({ ...prev, [key]: value }));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/pre-create-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: recipientFirstName.trim(),
          last_name: recipientLastName.trim(),
          gift_note_to_recipient: noteToRecipient.trim() || null,
          gift_note_private: notePrivate.trim() || null,
          gift_show_email: visibility.showEmail,
          gift_show_phone: visibility.showPhone,
          gift_show_linkedin: visibility.showLinkedIn,
          gift_show_bio: visibility.showBio,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate gift link');
      }

      const data = await res.json();
      const claimUrl = data.claimUrl;

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(claimUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });

      setGeneratedGift({
        claimUrl,
        qrDataUrl,
        recipientName: recipientFirstName.trim() || 'Someone',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopyLink() {
    if (!generatedGift) return;
    try {
      await navigator.clipboard.writeText(generatedGift.claimUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy link');
    }
  }

  async function handleShare() {
    if (!generatedGift || !navigator.share) return;
    try {
      await navigator.share({
        title: 'Claim your book!',
        text: noteToRecipient || `${gifterProfile.name} wants to gift you a book!`,
        url: generatedGift.claimUrl,
      });
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }

  function handleNewGift() {
    setGeneratedGift(null);
    setRecipientFirstName('');
    setRecipientLastName('');
    setNoteToRecipient('');
    setNotePrivate('');
    setError(null);
    setCopied(false);
  }

  // Show generated gift
  if (generatedGift) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Gift Ready!
            </span>
          </div>

          {generatedGift.recipientName !== 'Someone' && (
            <p className="text-gray-600 mb-4">
              For {generatedGift.recipientName}
            </p>
          )}

          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <img
              src={generatedGift.qrDataUrl}
              alt="Scan to claim"
              className="rounded-lg shadow-sm"
              style={{ width: 280, height: 280 }}
            />
          </div>

          <p className="text-gray-500 text-sm mb-6">
            Show this QR code to scan
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCopyLink}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>

            {canShare && (
              <button
                onClick={handleShare}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Link
              </button>
            )}

            <button
              onClick={handleNewGift}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              New Gift
            </button>
          </div>

          {/* Link Preview */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-gray-400 break-all">
              {generatedGift.claimUrl}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show form
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleGenerate} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Recipient Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={recipientFirstName}
              onChange={(e) => setRecipientFirstName(e.target.value)}
              placeholder="First name"
              className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
            />
            <input
              type="text"
              value={recipientLastName}
              onChange={(e) => setRecipientLastName(e.target.value)}
              placeholder="Last name"
              className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pre-fills their name on the claim form
          </p>
        </div>

        {/* Note to Recipient */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note to Recipient <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={noteToRecipient}
            onChange={(e) => setNoteToRecipient(e.target.value)}
            placeholder="Great meeting you at the conference!"
            rows={2}
            maxLength={500}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
          />
          <p className="text-xs text-gray-500 mt-1">
            Shown on the claim form and confirmation email
          </p>
        </div>

        {/* Private Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note to Self <span className="text-gray-400 font-normal">(private)</span>
          </label>
          <textarea
            value={notePrivate}
            onChange={(e) => setNotePrivate(e.target.value)}
            placeholder="Met at coffee break, interested in AI..."
            rows={2}
            maxLength={500}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
          />
          <p className="text-xs text-gray-500 mt-1">
            Only visible to you in the admin dashboard
          </p>
        </div>

        {/* Visibility Settings */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Show to recipient:
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={visibility.showLinkedIn}
                onChange={(e) => updateVisibility('showLinkedIn', e.target.checked)}
                disabled={!gifterProfile.linkedinUrl}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
              />
              <span className={`text-sm ${!gifterProfile.linkedinUrl ? 'text-gray-400' : 'text-gray-700'}`}>
                LinkedIn {!gifterProfile.linkedinUrl && '(not set)'}
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={visibility.showEmail}
                onChange={(e) => updateVisibility('showEmail', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Email ({gifterProfile.email})</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={visibility.showPhone}
                onChange={(e) => updateVisibility('showPhone', e.target.checked)}
                disabled={!gifterProfile.phone}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
              />
              <span className={`text-sm ${!gifterProfile.phone ? 'text-gray-400' : 'text-gray-700'}`}>
                Phone {gifterProfile.phone ? `(${gifterProfile.phone})` : '(not set)'}
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={visibility.showBio}
                onChange={(e) => updateVisibility('showBio', e.target.checked)}
                disabled={!gifterProfile.bio}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
              />
              <span className={`text-sm ${!gifterProfile.bio ? 'text-gray-400' : 'text-gray-700'}`}>
                Bio {!gifterProfile.bio && '(not set)'}
              </span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={generating}
          className="w-full py-4 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {generating ? 'Generating...' : 'Generate Gift Link'}
        </button>

        {/* Gifter Info Preview */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            Recipients will see: &quot;A gift from {gifterProfile.name}&quot;
            {visibility.showLinkedIn && gifterProfile.linkedinUrl && ' + LinkedIn'}
            {visibility.showEmail && ' + Email'}
            {visibility.showPhone && gifterProfile.phone && ' + Phone'}
            {visibility.showBio && gifterProfile.bio && ' + Bio'}
          </p>
        </div>
      </form>
    </div>
  );
}
