import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hashValue } from '@/lib/crypto/hash';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;

    // Verify admin session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionTokenHash = hashValue(sessionToken);
    const { data: session } = await supabaseAdmin
      .from('admin_sessions')
      .select('user_id')
      .eq('session_token_hash', sessionTokenHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session?.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current favorite status
    const { data: campaign, error: fetchError } = await supabaseAdmin
      .from('campaigns')
      .select('is_favorited')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Toggle favorite status
    const newFavorited = !campaign.is_favorited;

    const { error: updateError } = await supabaseAdmin
      .from('campaigns')
      .update({ is_favorited: newFavorited })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Error updating favorite status:', updateError);
      return NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 });
    }

    return NextResponse.json({ is_favorited: newFavorited });
  } catch (error: any) {
    console.error('Error in favorite toggle API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
