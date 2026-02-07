'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  campaignId: string;
  initialValue: boolean;
}

export default function LogoToggle({ campaignId, initialValue }: Props) {
  const [showLogo, setShowLogo] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    const newValue = !showLogo;

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_logo: newValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      setShowLogo(newValue);
      router.refresh();
    } catch (error) {
      console.error('Failed to toggle logo:', error);
      alert('Failed to update logo setting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-700">Show Logo:</span>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          showLogo ? 'bg-blue-600' : 'bg-gray-200'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={`Logo is currently ${showLogo ? 'visible' : 'hidden'} on campaign page`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            showLogo ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-xs text-gray-500">
        {showLogo ? 'On' : 'Off'}
      </span>
    </div>
  );
}
