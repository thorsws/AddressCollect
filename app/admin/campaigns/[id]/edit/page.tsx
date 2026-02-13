import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import EditCampaignForm from './EditCampaignForm';

export default async function EditCampaign({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    redirect('/admin/login');
  }

  const { id } = await params;

  // Fetch campaign
  const { data: campaign, error } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !campaign) {
    redirect('/admin');
  }

  // Check if user is a campaign member with edit access
  const { data: membership } = await supabaseAdmin
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', id)
    .eq('user_id', admin.id)
    .single();

  const memberRole = membership?.role;
  const canEdit = admin.role === 'super_admin' ||
                  campaign.created_by === admin.id ||
                  memberRole === 'owner' ||
                  memberRole === 'editor';

  if (!canEdit) {
    redirect('/admin');
  }

  // Check if there's a draft version - if so, use the draft data
  const { data: draftVersion } = await supabaseAdmin
    .from('campaign_versions')
    .select('*')
    .eq('campaign_id', id)
    .eq('status', 'draft')
    .single();

  // If there's a draft, merge the draft data into the campaign object
  const campaignData = draftVersion
    ? { ...campaign, ...draftVersion.data }
    : campaign;

  // Fetch questions for this campaign
  const { data: questions } = await supabaseAdmin
    .from('campaign_questions')
    .select('*')
    .eq('campaign_id', id)
    .order('display_order', { ascending: true });

  // Fetch all global settings for showing defaults
  const { data: globalSettings } = await supabaseAdmin
    .from('global_settings')
    .select('key, value');

  const globalDefaults: Record<string, string> = {};
  globalSettings?.forEach(s => {
    globalDefaults[s.key] = s.value;
  });

  return <EditCampaignForm campaign={campaignData} initialQuestions={questions || []} globalDefaults={globalDefaults} />;
}
