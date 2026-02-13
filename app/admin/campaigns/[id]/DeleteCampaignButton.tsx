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
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = () => {
    setShowConfirm(true);
    setConfirmText('');
  };

  const confirmDelete = async () => {
    if (confirmText !== 'DELETE') return;

    setShowConfirm(false);
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

  const canDelete = confirmText === 'DELETE';

  return (
    <>
      {/* Custom Delete Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowConfirm(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Campaign
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the campaign &quot;{campaignTitle}&quot;?
                This cannot be undone.
              </p>
              <p className="text-gray-600 text-sm mb-4">
                Note: You must delete all claims first.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-mono bg-gray-100 px-1 rounded">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={!canDelete}
                  className={`px-4 py-2 text-white rounded-md ${
                    canDelete
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Delete Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="px-3 py-2 bg-red-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-red-700 disabled:opacity-50 text-center"
      >
        {deleting ? 'Deleting...' : 'Delete'}
      </button>
    </>
  );
}
