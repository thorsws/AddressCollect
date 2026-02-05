import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { supabaseAdmin } from '@/lib/supabase/server';
import EditCampaignForm from './EditCampaignForm';

export default async function EditCampaign({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) {
    redirect('/admin/login');
  }

  // Fetch campaign
  const { data: campaign, error } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !campaign) {
    redirect('/admin');
  }

  return <EditCampaignForm campaign={campaign} />;
}
