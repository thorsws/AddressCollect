import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hashValue } from '@/lib/crypto/hash';
import GiftGenerator from './GiftGenerator';
import Link from 'next/link';

interface GiftPageProps {
  params: Promise<{ id: string }>;
}

export default async function GiftPage({ params }: GiftPageProps) {
  const { id: campaignId } = await params;

  // Check authentication
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;

  if (!sessionToken) {
    redirect('/admin/login');
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
    redirect('/admin/login');
  }

  // Fetch admin profile
  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, name, display_name, linkedin_url, bio, phone, role')
    .eq('id', session.user_id)
    .single();

  if (!admin) {
    redirect('/admin/login');
  }

  // Fetch campaign
  const { data: campaign, error } = await supabaseAdmin
    .from('campaigns')
    .select('id, slug, title, internal_title, created_by')
    .eq('id', campaignId)
    .single();

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Campaign Not Found</h1>
          <Link href="/admin" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check permissions
  const canGift = admin.role === 'super_admin' ||
    (admin.role === 'admin' && campaign.created_by === admin.id);

  if (!canGift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to gift from this campaign.</p>
          <Link href="/admin" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if admin has profile set up
  const hasProfile = admin.display_name || admin.linkedin_url;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/admin/campaigns/${campaignId}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            &larr; Back
          </Link>
          <Link
            href="/admin/settings"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Profile Settings
          </Link>
        </div>

        {/* Campaign Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Gift a Book
        </h1>
        <p className="text-gray-600 text-sm mb-4">
          {campaign.internal_title || campaign.title}
        </p>

        {/* Profile Setup Warning */}
        {!hasProfile && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>Tip:</strong> Set up your{' '}
              <Link href="/admin/settings" className="underline">
                gifter profile
              </Link>{' '}
              to include your name and LinkedIn when gifting books.
            </p>
          </div>
        )}

        {/* Gift Generator Component */}
        <GiftGenerator
          campaignId={campaign.id}
          campaignSlug={campaign.slug}
          gifterProfile={{
            name: admin.display_name || admin.name,
            email: admin.email,
            linkedinUrl: admin.linkedin_url,
            phone: admin.phone,
            bio: admin.bio,
          }}
        />
      </div>
    </div>
  );
}
