import { fetchOpenGraphData } from '@/lib/utils/opengraph';
import BannerImage from './BannerImage';

interface BannerPreviewProps {
  url: string;
}

/**
 * Banner Preview Component
 * Fetches and displays Open Graph metadata from a URL as a clickable preview card
 * Opens in a new tab so users don't lose their place on the form
 * Server component - fetches data at build/request time
 */
export default async function BannerPreview({ url }: BannerPreviewProps) {
  const ogData = await fetchOpenGraphData(url);

  // Gracefully fail - don't show anything if fetch fails or no data
  if (!ogData || !ogData.title) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 hover:bg-indigo-100 transition-colors"
    >
      <div className="flex items-start space-x-4">
        {ogData.image && (
          <div className="flex-shrink-0">
            <BannerImage src={ogData.image} alt={ogData.title} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {ogData.siteName && (
            <p className="text-xs text-indigo-600 font-medium mb-1 uppercase tracking-wide">
              {ogData.siteName}
            </p>
          )}
          <h3 className="text-indigo-900 font-semibold mb-1 line-clamp-2">
            {ogData.title}
          </h3>
          {ogData.description && (
            <p className="text-indigo-700 text-sm line-clamp-2">
              {ogData.description}
            </p>
          )}
          <p className="text-indigo-500 text-xs mt-2 flex items-center">
            <span>Learn more (opens in new tab)</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </p>
        </div>
      </div>
    </a>
  );
}
