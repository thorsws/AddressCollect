'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditor';
import RichContent from '@/components/RichContent';

interface Profile {
  id: string;
  email: string;
  name: string;
  display_name: string | null;
  linkedin_url: string | null;
  bio: string | null;
  phone: string | null;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultMessage, setDefaultMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/admin/profile');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await res.json();
      setProfile(data);
      setDisplayName(data.display_name || '');
      setLinkedinUrl(data.linkedin_url || '');
      setBio(data.bio || '');
      setPhone(data.phone || '');
      setDefaultMessage(data.default_message || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          linkedin_url: linkedinUrl,
          bio: bio,
          phone: phone,
          default_message: defaultMessage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save profile');
      }

      const data = await res.json();
      setProfile(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600 mb-6">
            Configure your gifter profile. This information is shown to recipients when you gift books in person.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              Profile saved successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={profile?.name || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Account name is set by administrators</p>
            </div>

            <hr className="my-6" />

            <h2 className="text-lg font-semibold text-gray-900">Gifter Profile</h2>
            <p className="text-sm text-gray-600 mb-4">
              This information appears when you gift books to people at events.
            </p>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={profile?.name || 'Your name'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Shown as &quot;A gift from [Display Name]&quot;. Defaults to your account name if empty.
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional. Can be shown to gift recipients.
              </p>
            </div>

            <div>
              <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL
              </label>
              <input
                id="linkedinUrl"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/yourprofile"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional. Recipients can connect with you on LinkedIn.
              </p>
            </div>

            <div>
              <label htmlFor="defaultMessage" className="block text-sm font-medium text-gray-700 mb-1">
                Default Gift Message
              </label>
              <RichTextEditor
                value={defaultMessage}
                onChange={setDefaultMessage}
                placeholder="e.g., Great meeting you! Enjoy the book..."
                rows={2}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional. Default message shown to recipients. Can be overridden per QR code.
              </p>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Short Bio
              </label>
              <RichTextEditor
                value={bio}
                onChange={setBio}
                placeholder="A brief introduction about yourself..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional. Supports formatting like bold, italic, and links.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>

          {/* Preview */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-900 font-semibold">
                A gift from {displayName || profile?.name || 'You'}
              </p>
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-700 text-sm hover:underline"
                >
                  Connect on LinkedIn &rarr;
                </a>
              )}
              {bio && (
                <RichContent content={bio} className="text-purple-800 text-sm mt-2" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
