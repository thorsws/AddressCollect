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
      [key]: { ...prev[key], value }
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
