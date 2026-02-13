import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { fetchOpenGraphData } from '@/lib/utils/opengraph';

export async function GET(request: NextRequest) {
  // Require admin auth
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    return admin;
  }

  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  try {
    // Validate URL
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const ogData = await fetchOpenGraphData(url);

    if (!ogData) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: ogData });
  } catch (error) {
    console.error('[OG API] Error fetching OG data:', error);
    return NextResponse.json({ error: 'Failed to fetch OG data' }, { status: 500 });
  }
}
