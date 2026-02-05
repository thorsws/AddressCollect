import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hashValue } from '@/lib/crypto/hash';

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  const tokenHash = hashValue(token);

  // Find verification record
  const { data: verification, error: verifyError } = await supabaseAdmin
    .from('email_verifications')
    .select('*, claims!inner(*)')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .single();

  if (verifyError || !verification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">
            This verification link is invalid or has already been used.
          </p>
        </div>
      </div>
    );
  }

  // Check if expired
  if (new Date(verification.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-600">
            This verification link has expired. Please request a new one.
          </p>
        </div>
      </div>
    );
  }

  // Mark claim as confirmed
  await supabaseAdmin
    .from('claims')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', verification.claim_id);

  // Mark verification as used
  await supabaseAdmin
    .from('email_verifications')
    .update({ used_at: new Date().toISOString() })
    .eq('id', verification.id);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
        <p className="text-gray-600 mb-6">
          Your email has been verified and your claim is confirmed. We&apos;ll ship your book soon!
        </p>
      </div>
    </div>
  );
}
