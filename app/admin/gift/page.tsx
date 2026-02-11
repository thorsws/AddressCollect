import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hashValue } from '@/lib/crypto/hash';
import GiftModeSelector from './GiftModeSelector';

export default async function GiftModePage() {
  // Check authentication
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;

  if (!sessionToken) {
    // Redirect to login with return URL
    redirect('/admin/login?redirect=/admin/gift');
  }

  // Verify session
  const sessionTokenHash = hashValue(sessionToken);
  const { data: session } = await supabaseAdmin
    .from('admin_sessions')
    .select('id, user_id')
    .eq('session_token_hash', sessionTokenHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!session?.user_id) {
    redirect('/admin/login?redirect=/admin/gift');
  }

  // Fetch admin profile
  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('id, name, display_name, linkedin_url, role')
    .eq('id', session.user_id)
    .single();

  if (!admin) {
    redirect('/admin/login?redirect=/admin/gift');
  }

  // Fetch campaigns this admin can gift from
  let campaignsQuery = supabaseAdmin
    .from('campaigns')
    .select('id, slug, title, internal_title, is_active')
    .eq('is_active', true)
    .order('title', { ascending: true });

  // Non-super admins can only see their own campaigns
  if (admin.role !== 'super_admin') {
    campaignsQuery = campaignsQuery.eq('created_by', admin.id);
  }

  const { data: campaigns } = await campaignsQuery;

  // If only one campaign, go directly to it
  if (campaigns && campaigns.length === 1) {
    redirect(`/admin/campaigns/${campaigns[0].id}/gift`);
  }

  const hasProfile = !!admin.display_name || !!admin.linkedin_url;

  return (
    <div className="min-h-screen bg-gray-50">
      <GiftModeSelector
        campaigns={campaigns || []}
        gifterName={admin.display_name || admin.name}
        hasProfile={hasProfile}
      />
    </div>
  );
}
