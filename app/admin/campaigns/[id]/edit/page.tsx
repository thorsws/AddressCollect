import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { canEditCampaign } from '@/lib/admin/permissions';
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

  // Check if user has permission to edit this campaign
  if (!canEditCampaign(admin.role, campaign.created_by, admin.id)) {
    redirect('/admin');
  }

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

  return <EditCampaignForm campaign={campaign} initialQuestions={questions || []} globalDefaults={globalDefaults} />;
}
