/**
 * Open Graph metadata fetcher utility
 * Fetches and parses Open Graph metadata from a URL
 */

export interface OpenGraphData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  url: string;
}

/**
 * Fetch Open Graph metadata from a URL
 * Returns null if fetch fails or if no OG data is found
 * Uses 24-hour caching and 5-second timeout
 */
export async function fetchOpenGraphData(url: string): Promise<OpenGraphData | null> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);

    // Fetch with timeout and caching
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // 24 hours
      signal: AbortSignal.timeout(5000), // 5 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AddressCollect/1.0; +https://addresscollect.app)',
      },
    });

    if (!response.ok) {
      console.error(`[OG Fetch] Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Parse OG tags using regex (simple approach)
    const getMetaContent = (property: string): string | null => {
      // Try property="og:..." format
      const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
      const match = html.match(regex);
      if (match) return match[1];

      // Try alternate format (content first)
      const altRegex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i');
      const altMatch = html.match(altRegex);
      return altMatch ? altMatch[1] : null;
    };

    const title = getMetaContent('og:title');
    const description = getMetaContent('og:description');
    const image = getMetaContent('og:image');
    const siteName = getMetaContent('og:site_name');

    // Return null if no OG data found
    if (!title && !description && !image) {
      console.log(`[OG Fetch] No Open Graph metadata found for ${url}`);
      return null;
    }

    return {
      title,
      description,
      image,
      siteName,
      url: url,
    };
  } catch (error) {
    console.error('[OG Fetch] Error:', error);
    return null;
  }
}
