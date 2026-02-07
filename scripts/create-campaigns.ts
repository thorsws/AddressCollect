import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

const campaigns = [
  {
    slug: 'staffing-industry',
    title: 'Pick Up Your Copy of Cognitive Kin',
    description: 'Thank you for attending the Staffing Industry Analysts event! Claim your complimentary copy of Cognitive Kin - a guide to navigating the future of work with AI.',
    capacity_total: 100,
    is_active: true,
    require_email: true,
    require_email_verification: true,
    require_invite_code: false,
    show_scarcity: true,
    test_mode: true,
    privacy_blurb: "Your address is only used to ship your book. We respect your privacy and won't share your information.",
    contact_email: 'jan.a.rosen@gmail.com',
    contact_text: 'Questions? Reach out to',
  },
  {
    slug: 'sxsw',
    title: 'SXSW Book Raffle - Win Cognitive Kin',
    description: "We're excited to meet you at SXSW! Enter our raffle for a chance to win a signed copy of Cognitive Kin. 50 lucky winners will be selected.",
    capacity_total: 50,
    is_active: true,
    require_email: true,
    require_email_verification: true,
    require_invite_code: false,
    show_scarcity: true,
    test_mode: true,
    privacy_blurb: "Your address is only used if you win the raffle. We'll notify winners by email.",
    contact_email: 'jan.a.rosen@gmail.com',
    contact_text: 'Questions about the raffle? Contact',
  },
  {
    slug: 'friends-family',
    title: 'Cognitive Kin - Complimentary Copy',
    description: "You're receiving this because you mean a lot to us! We'd love to send you a copy of Cognitive Kin. Simply enter your shipping address below.",
    capacity_total: 200,
    is_active: true,
    require_email: true,
    require_email_verification: true,
    require_invite_code: false,
    show_scarcity: false,
    test_mode: true,
    privacy_blurb: "Your address is only used to ship your book. Your information stays private.",
    contact_email: 'jan.a.rosen@gmail.com',
    contact_text: 'Any questions? Just email',
  },
  {
    slug: 'chalmers-alumni-usa',
    title: 'Chalmers Alumni USA - Book Raffle',
    description: "Fellow Chalmerist! Enter our raffle for a chance to receive a copy of Cognitive Kin. We're giving away books to alumni across the United States.",
    capacity_total: 50,
    is_active: true,
    require_email: true,
    require_email_verification: true,
    require_invite_code: false,
    show_scarcity: true,
    test_mode: true,
    privacy_blurb: "Your address is only used if you're selected. We respect your privacy as fellow alumni.",
    contact_email: 'jan.a.rosen@gmail.com',
    contact_text: 'Questions? Reach out to',
  },
];

async function createCampaigns() {
  console.log('Creating test campaigns...\n');

  for (const campaign of campaigns) {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();

    if (error) {
      console.log(`✗ ${campaign.slug}: ${error.message}`);
    } else {
      console.log(`✓ Created: ${campaign.title}`);
      console.log(`  URL: /c/${campaign.slug}`);
      console.log(`  Capacity: ${campaign.capacity_total}, Test Mode: ${campaign.test_mode}`);
      console.log('');
    }
  }

  console.log('Done!');
}

createCampaigns().catch(console.error);
