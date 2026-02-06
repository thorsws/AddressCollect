import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hashValue, hashIP } from '@/lib/crypto/hash';
import { createSession, setSessionCookie } from '@/lib/admin/session';
import { getClientIP, getUserAgent } from '@/lib/utils/request';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || typeof email !== 'string' || !otp || typeof otp !== 'string') {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpHash = hashValue(otp);

    // Find the most recent OTP request for this email
    const { data: otpRequest, error: fetchError } = await supabaseAdmin
      .from('admin_otp_requests')
      .select('*')
      .eq('email', normalizedEmail)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRequest) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Check if OTP is expired
    if (new Date(otpRequest.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 401 }
      );
    }

    // Check if max attempts exceeded
    if (otpRequest.attempts >= otpRequest.max_attempts) {
      return NextResponse.json(
        { error: 'Too many failed attempts' },
        { status: 401 }
      );
    }

    // Verify OTP hash
    if (otpRequest.otp_hash !== otpHash) {
      // Increment attempts
      await supabaseAdmin
        .from('admin_otp_requests')
        .update({ attempts: otpRequest.attempts + 1 })
        .eq('id', otpRequest.id);

      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('admin_otp_requests')
      .update({ used_at: new Date().toISOString() })
      .eq('id', otpRequest.id);

    // Fetch user from admin_users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, name, role, is_active')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      console.error('[Auth] User not found in admin_users:', normalizedEmail);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      console.error('[Auth] User is inactive:', normalizedEmail);
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      );
    }

    // Create session
    const clientIP = await getClientIP();
    const ipHash = hashIP(clientIP);
    const userAgent = await getUserAgent();

    const sessionToken = await createSession(normalizedEmail, user.id, ipHash, userAgent);

    // Set cookie
    await setSessionCookie(sessionToken);

    console.log(`[Auth] Admin logged in: ${normalizedEmail} (${user.name}, ${user.role})`);
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('[Auth] Error in verify-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
