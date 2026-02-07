import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createWFGCampaign() {
  console.log('Creating WFG Odyssey raffle campaign...\n');

  const campaign = {
    slug: 'ai-future-raffle',
    title: 'Win a Copy of Cognitive Kin',
    description: `AI is rapidly transforming every aspect of our lives—from how we work and communicate to how we make decisions and build relationships.

Understanding this shift isn't just about keeping up with technology. It's about positioning yourself and your family to thrive in a world where human and artificial intelligence work together.

**Cognitive Kin** explores how AI will reshape our personal and professional lives, and provides practical insights on how to adapt these powerful tools to your advantage.

Enter this raffle for a chance to win a free copy and start your journey toward an AI-empowered future.`,
    capacity_total: 0, // Unlimited for raffle
    is_active: true,
    require_email: true,
    require_email_verification: false,
    require_invite_code: false,
    show_scarcity: false, // No scarcity for raffle
    collect_company: true,
    collect_phone: false,
    collect_title: true,
    max_claims_per_email: 1,
    max_claims_per_ip_per_day: 5,
    test_mode: false,
    show_banner: true,
    banner_url: 'https://www.cognitivekin.com/images/book-cover.jpg', // Update with actual banner URL
    contact_email: 'jan.rosen@rallertechnologies.com',
    contact_text: 'Questions? Contact us',
    privacy_blurb: 'Your information will only be used for this raffle and book delivery. We respect your privacy.',
    kiosk_mode: false,
    starts_at: new Date().toISOString(), // Starts now
    ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
  };

  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single();

  if (error) {
    console.error('Error creating campaign:', error.message);
    return;
  }

  console.log('Campaign created successfully!');
  console.log('---');
  console.log(`Title: ${data.title}`);
  console.log(`Slug: ${data.slug}`);
  console.log(`URL: /c/${data.slug}`);
  console.log(`Starts: ${new Date(data.starts_at).toLocaleString()}`);
  console.log(`Ends: ${new Date(data.ends_at).toLocaleString()}`);
  console.log(`Banner: ${data.show_banner ? 'Yes' : 'No'}`);
  console.log(`Raffle mode: Unlimited capacity, no scarcity`);
  console.log('---');
  console.log('\nDone!');
}

createWFGCampaign();
