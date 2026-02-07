'use client';

import { useState, ReactNode } from 'react';

interface BannerModalProps {
  url: string;
  children: ReactNode;
}

export default function BannerModal({ url, children }: BannerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger - the banner card */}
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-2 shadow-md z-10"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content - iframe with fallback */}
            <iframe
              src={url}
              className="w-full h-[80vh] rounded-lg"
              title="Preview"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              onError={() => {
                // If iframe fails to load, show fallback
                const iframe = document.querySelector('iframe');
                if (iframe) {
                  iframe.style.display = 'none';
                }
              }}
            />

            {/* Fallback: Open in new tab button */}
            <div className="p-6 text-center border-t">
              <p className="text-gray-600 mb-4">
                Some sites cannot be displayed in a preview. Click below to open in a new tab.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Open in New Tab
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
