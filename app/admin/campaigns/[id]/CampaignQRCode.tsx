'use client';

import { useState } from 'react';

interface Props {
  campaignSlug: string;
  campaignTitle: string;
}

export default function CampaignQRCode({ campaignSlug, campaignTitle }: Props) {
  const [showLarge, setShowLarge] = useState(false);

  // Use the production URL or current origin
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.APP_BASE_URL || 'http://localhost:3000';

  const campaignUrl = `${baseUrl}/c/${campaignSlug}`;

  // QR code API - generates on the fly based on URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(campaignUrl)}`;
  const qrCodeUrlLarge = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(campaignUrl)}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(campaignUrl);
    alert('Campaign URL copied to clipboard!');
  };

  const copyQR = async () => {
    try {
      const response = await fetch(qrCodeUrlLarge);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert('QR code copied to clipboard!');
    } catch (error) {
      // Fallback: some browsers don't support clipboard.write for images
      alert('Copy not supported in this browser. Please use Download instead.');
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrlLarge;
    link.download = `qr-${campaignSlug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign QR Code</h2>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* QR Code */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowLarge(true)}
              className="block hover:opacity-80 transition-opacity"
              title="Click to enlarge"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt={`QR code for ${campaignTitle}`}
                width={150}
                height={150}
                className="rounded border border-gray-200"
              />
            </button>
            <p className="text-xs text-gray-500 mt-1 text-center">Click to enlarge</p>
          </div>

          {/* URL and Actions */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={campaignUrl}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 truncate"
                />
                <button
                  onClick={copyUrl}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={copyQR}
                className="px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Copy QR
              </button>
              <button
                onClick={downloadQR}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download QR
              </button>
              <a
                href={campaignUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Open Campaign
              </a>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              QR code links to: <code className="bg-gray-100 px-1 rounded">/c/{campaignSlug}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Large QR Modal */}
      {showLarge && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLarge(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{campaignTitle}</h3>
              <button
                onClick={() => setShowLarge(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrlLarge}
                alt={`QR code for ${campaignTitle}`}
                width={300}
                height={300}
                className="rounded"
              />
            </div>
            <p className="text-center text-sm text-gray-600 mt-4 break-all">{campaignUrl}</p>
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={copyQR}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Copy QR
              </button>
              <button
                onClick={downloadQR}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download
              </button>
              <button
                onClick={copyUrl}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Copy URL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
