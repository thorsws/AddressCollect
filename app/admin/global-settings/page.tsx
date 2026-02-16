'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

interface GlobalSetting {
  key: string;
  value: string;
  description: string;
}

export default function GlobalSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, GlobalSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/global-settings');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      const settingsMap: Record<string, GlobalSetting> = {};
      data.forEach((s: GlobalSetting) => {
        settingsMap[s.key] = s;
      });
      setSettings(settingsMap);
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: { key, description: prev[key]?.description || '', value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/global-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: Object.values(settings) }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Global Settings</h1>
          <p className="text-gray-600 mb-8">
            Configure default text that applies to all campaigns. Individual campaigns can override these defaults with their own custom text.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          <div className="space-y-8">
            {/* Leaderboard Settings */}
            <div className="border-b pb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Leaderboard</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="leaderboard_enabled"
                    checked={settings['leaderboard_enabled']?.value === 'true'}
                    onChange={(e) => updateSetting('leaderboard_enabled', e.target.checked ? 'true' : 'false')}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor="leaderboard_enabled" className="text-sm font-medium text-gray-700">
                    Enable public leaderboard sharing
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leaderboard Title
                  </label>
                  <input
                    type="text"
                    value={settings['leaderboard_title']?.value || ''}
                    onChange={(e) => updateSetting('leaderboard_title', e.target.value)}
                    placeholder="Leaderboard"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Share Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings['leaderboard_key']?.value || ''}
                      onChange={(e) => updateSetting('leaderboard_key', e.target.value)}
                      placeholder="Enter a secret key"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const key = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
                        updateSetting('leaderboard_key', key);
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 shrink-0"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {settings['leaderboard_enabled']?.value === 'true' && settings['leaderboard_key']?.value && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-xs text-blue-700 font-medium mb-1">Shareable URL:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-blue-900 bg-blue-100 px-2 py-1 rounded flex-1 overflow-x-auto">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/leaderboard?key={settings['leaderboard_key'].value}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/leaderboard?key=${settings['leaderboard_key']?.value}`;
                          navigator.clipboard.writeText(url);
                        }}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Default Consent Text */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                Default Consent Checkbox Text
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Text shown next to the required consent checkbox at the bottom of all campaign forms. Campaigns can override this with their own text.
              </p>
              <RichTextEditor
                value={settings['default_consent_text']?.value || ''}
                onChange={(value) => updateSetting('default_consent_text', value)}
                rows={4}
              />
            </div>

            {/* Default Privacy Blurb */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-2">
                Default Privacy Blurb
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Default privacy message shown in the green box on campaign forms. Campaigns can override this with their own text.
              </p>
              <RichTextEditor
                value={settings['default_privacy_blurb']?.value || ''}
                onChange={(value) => updateSetting('default_privacy_blurb', value)}
                rows={3}
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex justify-end gap-4">
            <Link
              href="/admin"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
