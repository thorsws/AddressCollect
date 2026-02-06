import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateOTP, hashValue, hashIP } from '@/lib/crypto/hash';
import { sendAdminOtpEmail } from '@/lib/mailgun';
import { getClientIP } from '@/lib/utils/request';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email exists in admin_users table and is active
    const { data: adminUser, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, is_active')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !adminUser) {
      // Don't reveal if email is not found for security
      console.log(`[Auth] OTP request for unknown email: ${normalizedEmail}`);
      return NextResponse.json({ ok: true });
    }

    if (!adminUser.is_active) {
      console.log(`[Auth] OTP request for inactive user: ${normalizedEmail}`);
      return NextResponse.json({ ok: true });
    }

    // Get client IP for rate limiting
    const clientIP = await getClientIP();
    const ipHash = hashIP(clientIP);

    // Rate limit: Max 3 OTP sends per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentEmailRequests } = await supabaseAdmin
      .from('admin_otp_requests')
      .select('id')
      .eq('email', normalizedEmail)
      .gte('created_at', oneHourAgo);

    if (recentEmailRequests && recentEmailRequests.length >= 3) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Rate limit: Max 10 OTP sends per IP per hour
    const { data: recentIPRequests } = await supabaseAdmin
      .from('admin_otp_requests')
      .select('id')
      .eq('ip_hash', ipHash)
      .gte('created_at', oneHourAgo);

    if (recentIPRequests && recentIPRequests.length >= 10) {
      return NextResponse.json(
        { error: 'Too many OTP requests from this IP. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashValue(otp);

    // OTP expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OTP hash in database
    const { error: dbError } = await supabaseAdmin
      .from('admin_otp_requests')
      .insert({
        email: normalizedEmail,
        otp_hash: otpHash,
        expires_at: expiresAt,
        ip_hash: ipHash,
        attempts: 0,
        max_attempts: 5,
      });

    if (dbError) {
      console.error('[Auth] Database error storing OTP:', dbError);
      return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
      );
    }

    // Send OTP via Mailgun
    try {
      await sendAdminOtpEmail(normalizedEmail, otp);
    } catch (emailError) {
      console.error('[Auth] Failed to send OTP email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    console.log(`[Auth] OTP sent successfully to ${normalizedEmail}`);
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('[Auth] Error in request-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
