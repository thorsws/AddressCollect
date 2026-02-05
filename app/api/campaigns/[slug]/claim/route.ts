import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateAddressFingerprint, normalizeEmail } from '@/lib/utils/address';
import { hashIP, generateSessionToken, hashValue } from '@/lib/crypto/hash';
import { getClientIP, getUserAgent } from '@/lib/utils/request';
import { sendClaimVerificationEmail } from '@/lib/mailgun';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      company,
      title,
      phone,
      address1,
      address2,
      city,
      region,
      postalCode,
      country,
      inviteCode,
    } = body;

    // 1. Load campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or inactive' },
        { status: 404 }
      );
    }

    // 2. Check date window
    const now = new Date();
    if (campaign.start_at && new Date(campaign.start_at) > now) {
      return NextResponse.json(
        { error: 'Campaign has not started yet' },
        { status: 400 }
      );
    }
    if (campaign.end_at && new Date(campaign.end_at) < now) {
      return NextResponse.json(
        { error: 'Campaign has ended' },
        { status: 400 }
      );
    }

    // 3. Validate required fields
    if (!firstName || !lastName || !address1 || !city || !region || !postalCode || !country) {
      return NextResponse.json(
        { error: 'Missing required address fields' },
        { status: 400 }
      );
    }

    if (campaign.require_email && !email) {
      return NextResponse.json(
        { error: 'Email is required for this campaign' },
        { status: 400 }
      );
    }

    // 4. Validate invite code if required
    if (campaign.require_invite_code) {
      if (!inviteCode) {
        return NextResponse.json(
          { error: 'Invite code is required' },
          { status: 400 }
        );
      }

      const { data: codeData, error: codeError } = await supabaseAdmin
        .from('invite_codes')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('code', inviteCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (codeError || !codeData) {
        return NextResponse.json(
          { error: 'Invalid invite code' },
          { status: 400 }
        );
      }

      // Check if code has reached max uses
      if (codeData.max_uses && codeData.uses >= codeData.max_uses) {
        return NextResponse.json(
          { error: 'Invite code has reached maximum uses' },
          { status: 400 }
        );
      }

      // Increment code usage
      await supabaseAdmin
        .from('invite_codes')
        .update({ uses: codeData.uses + 1 })
        .eq('id', codeData.id);
    }

    // 5. Check capacity
    const { count: confirmedCount } = await supabaseAdmin
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .eq('status', 'confirmed');

    if (confirmedCount && confirmedCount >= campaign.capacity_total) {
      return NextResponse.json(
        { error: 'Campaign is at capacity' },
        { status: 400 }
      );
    }

    // 6. Get client info for rate limiting
    const clientIP = await getClientIP();
    const ipHash = hashIP(clientIP);
    const userAgent = await getUserAgent();

    // 7. Rate limit by IP (per day)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentClaims } = await supabaseAdmin
      .from('claims')
      .select('id')
      .eq('campaign_id', campaign.id)
      .eq('ip_hash', ipHash)
      .gte('created_at', oneDayAgo);

    if (recentClaims && recentClaims.length >= campaign.max_claims_per_ip_per_day) {
      return NextResponse.json(
        { error: 'Too many claims from this IP address' },
        { status: 429 }
      );
    }

    // 8. Generate address fingerprint
    const addressFingerprint = generateAddressFingerprint(
      firstName,
      lastName,
      address1,
      city,
      region,
      postalCode,
      country
    );

    // 9. Check for duplicate address
    const { data: existingClaim } = await supabaseAdmin
      .from('claims')
      .select('id')
      .eq('campaign_id', campaign.id)
      .eq('address_fingerprint', addressFingerprint)
      .single();

    if (existingClaim) {
      return NextResponse.json(
        { error: 'This address has already been claimed for this campaign' },
        { status: 400 }
      );
    }

    // 10. Check for duplicate email if provided
    if (email && campaign.max_claims_per_email > 0) {
      const emailNormalized = normalizeEmail(email);
      const { count: emailCount } = await supabaseAdmin
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('email_normalized', emailNormalized);

      if (emailCount && emailCount >= campaign.max_claims_per_email) {
        return NextResponse.json(
          { error: 'This email has already been used for this campaign' },
          { status: 400 }
        );
      }
    }

    // 11. Determine initial status
    const initialStatus = campaign.require_email_verification ? 'pending' : 'confirmed';

    // 12. Insert claim
    const { data: claim, error: insertError } = await supabaseAdmin
      .from('claims')
      .insert({
        campaign_id: campaign.id,
        status: initialStatus,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email ? email.trim() : null,
        company: company ? company.trim() : null,
        title: title ? title.trim() : null,
        phone: phone ? phone.trim() : null,
        address1: address1.trim(),
        address2: address2 ? address2.trim() : null,
        city: city.trim(),
        region: region.trim(),
        postal_code: postalCode.trim(),
        country: country.trim(),
        invite_code: inviteCode ? inviteCode.toUpperCase() : null,
        email_normalized: email ? normalizeEmail(email) : null,
        address_fingerprint: addressFingerprint,
        ip_hash: ipHash,
        user_agent: userAgent,
        confirmed_at: initialStatus === 'confirmed' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Claim] Database error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create claim' },
        { status: 500 }
      );
    }

    // 13. Send verification email if required
    if (campaign.require_email_verification && email) {
      const verificationToken = generateSessionToken();
      const tokenHash = hashValue(verificationToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      // Store verification token
      await supabaseAdmin
        .from('email_verifications')
        .insert({
          claim_id: claim.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        });

      // Send email
      const verificationLink = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;
      try {
        await sendClaimVerificationEmail(email, verificationLink, campaign.title);
      } catch (emailError) {
        console.error('[Claim] Failed to send verification email:', emailError);
        // Don't fail the claim, just log the error
      }

      return NextResponse.json({
        ok: true,
        requiresVerification: true,
        claimId: claim.id,
      });
    }

    // 14. Return success
    return NextResponse.json({
      ok: true,
      requiresVerification: false,
      claimId: claim.id,
    });

  } catch (error) {
    console.error('[Claim] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
