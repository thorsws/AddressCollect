import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateAddressFingerprint, generateLocationFingerprint, normalizeEmail } from '@/lib/utils/address';
import { hashIP, generateSessionToken, hashValue } from '@/lib/crypto/hash';
import { getClientIP, getUserAgent } from '@/lib/utils/request';
import { sendClaimVerificationEmail, sendGiftConfirmationEmail } from '@/lib/mailgun';

/**
 * Handle submission of a pre-created claim (via unique token URL)
 */
async function handlePreCreatedClaim(
  claimToken: string,
  campaign: any,
  data: any
): Promise<NextResponse> {
  const {firstName, lastName, email, company, title, phone, address1, address2, city, region, postalCode, country, inviteCode, consent} = data;

  // Validate required fields
  if (!firstName || !lastName || !address1 || !city || !region || !postalCode || !country) {
    return NextResponse.json(
      { error: 'Missing required address fields' },
      { status: 400 }
    );
  }

  // Validate consent
  if (!consent) {
    return NextResponse.json(
      { error: 'Consent is required to submit' },
      { status: 400 }
    );
  }

  // Fetch the pre-created claim
  const { data: existingClaim, error: claimError } = await supabaseAdmin
    .from('claims')
    .select('*')
    .eq('claim_token', claimToken)
    .eq('campaign_id', campaign.id)
    .single();

  if (claimError || !existingClaim) {
    return NextResponse.json(
      { error: 'Invalid or expired claim token' },
      { status: 404 }
    );
  }

  // Check if already submitted (has address)
  if (existingClaim.address1) {
    return NextResponse.json(
      { error: 'This claim has already been submitted' },
      { status: 400 }
    );
  }

  // Get client info
  const clientIP = await getClientIP();
  const ipHash = hashIP(clientIP);
  const userAgent = await getUserAgent();

  // Generate address fingerprints
  const addressFingerprint = generateAddressFingerprint(
    firstName,
    lastName,
    address1,
    city,
    region,
    postalCode,
    country
  );

  const locationFingerprint = generateLocationFingerprint(
    address1,
    city,
    region,
    postalCode,
    country
  );

  // Check if another person with same name at same address has already claimed
  const { data: duplicatePerson } = await supabaseAdmin
    .from('claims')
    .select('id')
    .eq('campaign_id', campaign.id)
    .eq('address_fingerprint', addressFingerprint)
    .neq('id', existingClaim.id)
    .single();

  if (duplicatePerson) {
    return NextResponse.json(
      { error: "Good news - you're already registered! We have your information for this campaign." },
      { status: 400 }
    );
  }

  // Check if address has reached max number of different people
  if (campaign.max_claims_per_address && campaign.max_claims_per_address > 0) {
    const { count: addressCount } = await supabaseAdmin
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .eq('location_fingerprint', locationFingerprint)
      .neq('id', existingClaim.id); // Exclude the current claim

    if (addressCount && addressCount >= campaign.max_claims_per_address) {
      const limit = campaign.max_claims_per_address;
      return NextResponse.json(
        {
          error: `This address has reached the maximum of ${limit} ${limit === 1 ? 'person' : 'people'} for this campaign`
        },
        { status: 400 }
      );
    }
  }

  // Determine final status
  const finalStatus = campaign.require_email_verification && email ? 'pending' : 'confirmed';

  // Update the claim with address and other fields
  const { data: updatedClaim, error: updateError } = await supabaseAdmin
    .from('claims')
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email ? email.trim() : existingClaim.email,
      company: company ? company.trim() : existingClaim.company,
      title: title ? title.trim() : existingClaim.title,
      phone: phone ? phone.trim() : existingClaim.phone,
      address1: address1.trim(),
      address2: address2 ? address2.trim() : null,
      city: city.trim(),
      region: region.trim(),
      postal_code: postalCode.trim(),
      country: country.trim(),
      invite_code: inviteCode ? inviteCode.toUpperCase() : null,
      email_normalized: email ? normalizeEmail(email) : (existingClaim.email ? normalizeEmail(existingClaim.email) : null),
      address_fingerprint: addressFingerprint,
      location_fingerprint: locationFingerprint,
      ip_hash: ipHash,
      user_agent: userAgent,
      consent_given: consent === true,
      consent_timestamp: consent === true ? new Date().toISOString() : null,
      status: finalStatus,
      is_test_claim: campaign.test_mode,
      confirmed_at: finalStatus === 'confirmed' ? new Date().toISOString() : null,
    })
    .eq('id', existingClaim.id)
    .select()
    .single();

  if (updateError) {
    console.error('[Pre-Claim] Update error:', updateError);
    return NextResponse.json(
      { error: 'Failed to submit claim' },
      { status: 500 }
    );
  }

  // Send verification email if required
  if (campaign.require_email_verification && email) {
    const verificationToken = generateSessionToken();
    const tokenHash = hashValue(verificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from('email_verifications')
      .insert({
        claim_id: updatedClaim.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    const verificationLink = `${process.env.NEXT_PUBLIC_CAMPAIGN_URL || process.env.APP_BASE_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;
    try {
      await sendClaimVerificationEmail(email, verificationLink, campaign.title);
    } catch (emailError) {
      console.error('[Pre-Claim] Failed to send verification email:', emailError);
    }

    return NextResponse.json({
      ok: true,
      requiresVerification: true,
      claimId: updatedClaim.id,
    });
  }

  console.log(`[Pre-Claim] Submitted: Token=${claimToken}, Email=${email || 'none'}`);

  // Send gift confirmation email if this is a gifted claim with email
  const recipientEmail = email || existingClaim.email;
  if (existingClaim.pre_created_by && recipientEmail) {
    try {
      // Fetch gifter info
      const { data: gifter } = await supabaseAdmin
        .from('admin_users')
        .select('name, display_name, linkedin_url')
        .eq('id', existingClaim.pre_created_by)
        .single();

      if (gifter) {
        const gifterName = gifter.display_name || gifter.name;
        await sendGiftConfirmationEmail(
          recipientEmail,
          campaign.title,
          gifterName,
          gifter.linkedin_url,
          existingClaim.gift_note_to_recipient
        );
        console.log(`[Pre-Claim] Gift confirmation email sent to ${recipientEmail}`);
      }
    } catch (emailError) {
      console.error('[Pre-Claim] Failed to send gift confirmation email:', emailError);
      // Don't fail the claim, just log the error
    }
  }

  return NextResponse.json({
    ok: true,
    requiresVerification: false,
    claimId: updatedClaim.id,
  });
}

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
      claimToken, // Optional: for pre-created claims
      answers, // Custom question answers: { questionId: answer }
      consent, // User consent to data collection
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

    // 3. Handle pre-created claim with token
    if (claimToken) {
      return await handlePreCreatedClaim(
        claimToken,
        campaign,
        {firstName, lastName, email, company, title, phone, address1, address2, city, region, postalCode, country, inviteCode, consent}
      );
    }

    // 3b. Validate required fields
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

    // 3c. Validate consent
    if (!consent) {
      return NextResponse.json(
        { error: 'Consent is required to submit' },
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

    // 5. Check capacity (skip if unlimited - capacity_total is null or 0)
    if (campaign.capacity_total && campaign.capacity_total > 0) {
      const { count: confirmedCount } = await supabaseAdmin
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('status', 'confirmed')
        .eq('is_test_claim', false);

      if (confirmedCount && confirmedCount >= campaign.capacity_total) {
        return NextResponse.json(
          { error: 'Campaign is at capacity' },
          { status: 400 }
        );
      }
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

    // 8. Generate address fingerprints
    // address_fingerprint includes name - prevents same person from claiming twice
    const addressFingerprint = generateAddressFingerprint(
      firstName,
      lastName,
      address1,
      city,
      region,
      postalCode,
      country
    );

    // location_fingerprint excludes name - counts different people at same address
    const locationFingerprint = generateLocationFingerprint(
      address1,
      city,
      region,
      postalCode,
      country
    );

    // 9a. Check if this exact person (name + address) has already claimed
    const { data: existingClaim } = await supabaseAdmin
      .from('claims')
      .select('id')
      .eq('campaign_id', campaign.id)
      .eq('address_fingerprint', addressFingerprint)
      .single();

    if (existingClaim) {
      return NextResponse.json(
        { error: "Good news - you're already registered! We have your information for this campaign." },
        { status: 400 }
      );
    }

    // 9b. Check if address has reached max number of different people
    if (campaign.max_claims_per_address && campaign.max_claims_per_address > 0) {
      const { count: addressCount } = await supabaseAdmin
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('location_fingerprint', locationFingerprint);

      if (addressCount && addressCount >= campaign.max_claims_per_address) {
        const limit = campaign.max_claims_per_address;
        return NextResponse.json(
          {
            error: `This address has reached the maximum of ${limit} ${limit === 1 ? 'person' : 'people'} for this campaign`
          },
          { status: 400 }
        );
      }
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
        is_test_claim: campaign.test_mode,
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
        location_fingerprint: locationFingerprint,
        ip_hash: ipHash,
        user_agent: userAgent,
        consent_given: consent === true,
        consent_timestamp: consent === true ? new Date().toISOString() : null,
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

    // 12b. Save custom question answers
    if (answers && typeof answers === 'object') {
      const answerEntries = Object.entries(answers).filter(([, value]) => {
        // Filter out empty values (empty strings or empty arrays)
        if (Array.isArray(value)) return value.length > 0;
        return value && String(value).trim();
      });
      if (answerEntries.length > 0) {
        const answerInserts = answerEntries.map(([questionId, answer]) => ({
          claim_id: claim.id,
          question_id: questionId,
          // For arrays (checkboxes), store as JSON string in answer_text
          answer_text: Array.isArray(answer) ? JSON.stringify(answer) : (typeof answer === 'string' ? answer : null),
          // answer_option is for single-select multiple_choice only
          answer_option: typeof answer === 'string' ? answer : null,
        }));

        await supabaseAdmin.from('claim_answers').insert(answerInserts);
      }
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
      const verificationLink = `${process.env.NEXT_PUBLIC_CAMPAIGN_URL || process.env.APP_BASE_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;
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
