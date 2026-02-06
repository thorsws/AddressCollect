'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  campaignId: string;
  campaignTitle: string;
}

export default function DeleteCampaignButton({ campaignId, campaignTitle }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the campaign "${campaignTitle}"? This cannot be undone.\n\nNote: You must delete all claims first.`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete campaign');
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      alert('Failed to delete campaign');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-50"
    >
      {deleting ? 'Deleting...' : 'Delete Campaign'}
    </button>
  );
}
