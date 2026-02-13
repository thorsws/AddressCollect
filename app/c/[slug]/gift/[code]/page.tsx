import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import StaticGiftClaimForm from './StaticGiftClaimForm';

interface StaticGiftPageProps {
  params: Promise<{ slug: string; code: string }>;
}

export default async function StaticGiftPage({ params }: StaticGiftPageProps) {
  const { slug, code } = await params;

  // Fetch campaign by slug
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .single();

  if (campaignError || !campaign) {
    notFound();
  }

  // Check if campaign is active and within date window
  const now = new Date();
  if (!campaign.is_active) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Available</h1>
            <p className="text-gray-600">This campaign is currently not active.</p>
          </div>
        </div>
      </div>
    );
  }

  if (campaign.ends_at && new Date(campaign.ends_at) < now) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Ended</h1>
            <p className="text-gray-600">This campaign has ended. Thank you for your interest.</p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch static gift code
  const { data: giftCode, error: giftCodeError } = await supabaseAdmin
    .from('admin_gift_codes')
    .select(`
      *,
      admin:admin_users!admin_id(id, name, display_name, email, phone, linkedin_url, bio)
    `)
    .eq('code', code)
    .eq('campaign_id', campaign.id)
    .single();

  if (giftCodeError || !giftCode) {
    notFound();
  }

  // Build gifter info from admin profile, respecting code visibility settings
  const admin = giftCode.admin;

  // Determine display name - use custom from code, or admin profile, or default
  const displayName = giftCode.custom_display_name || admin.display_name || admin.name;

  // Build gifter info respecting visibility flags
  const gifterInfo = {
    id: admin.id,
    name: giftCode.show_name !== false ? displayName : null,
    email: giftCode.show_email ? admin.email : null,
    phone: giftCode.show_phone ? admin.phone : null,
    linkedinUrl: giftCode.show_linkedin !== false ? admin.linkedin_url : null,
    bio: giftCode.show_bio ? admin.bio : null,
  };

  // Custom message from the code
  const customMessage = giftCode.custom_message || null;

  // Fetch global settings for defaults
  const { data: globalSettings } = await supabaseAdmin
    .from('global_settings')
    .select('key, value')
    .in('key', ['default_consent_text', 'default_privacy_blurb']);

  const globalDefaults: Record<string, string> = {};
  globalSettings?.forEach(s => {
    globalDefaults[s.key] = s.value;
  });

  // Fetch custom questions
  const { data: questions } = await supabaseAdmin
    .from('campaign_questions')
    .select('*')
    .eq('campaign_id', campaign.id)
    .order('display_order', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <StaticGiftClaimForm
          campaign={campaign}
          gifterInfo={gifterInfo}
          customMessage={customMessage}
          questions={questions || []}
          globalDefaults={globalDefaults}
        />
      </div>
    </div>
  );
}
