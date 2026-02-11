import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);

const getMailgunClient = () => {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    throw new Error('Missing Mailgun configuration. Check MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.');
  }

  return mailgun.client({
    username: 'api',
    key: apiKey,
  });
};

/**
 * Send OTP email to admin user
 * IMPORTANT: Never log the OTP value
 */
export async function sendAdminOtpEmail(
  email: string,
  otp: string,
  campaignName?: string
): Promise<void> {
  const mg = getMailgunClient();
  const domain = process.env.MAILGUN_DOMAIN!;
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || `noreply@${domain}`;

  const subject = 'Your Admin Login Code';
  const text = `
Your one-time login code is: ${otp}

This code will expire in 10 minutes.

${campaignName ? `Campaign: ${campaignName}` : ''}

If you didn't request this code, please ignore this email.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0;">
    <h2 style="color: #1a1a1a; margin-top: 0;">Your Admin Login Code</h2>
    <p>Your one-time login code is:</p>
    <div style="background-color: #ffffff; border: 2px solid #4a90e2; border-radius: 6px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a; margin: 20px 0;">
      ${otp}
    </div>
    <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
    ${campaignName ? `<p style="color: #666; font-size: 14px;">Campaign: <strong>${campaignName}</strong></p>` : ''}
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
  </div>
</body>
</html>
  `.trim();

  try {
    await mg.messages.create(domain, {
      from: fromEmail,
      to: [email],
      subject,
      text,
      html,
    });

    // Log success without logging the OTP
    console.log(`[Mailgun] OTP email sent to ${email}`);
  } catch (error) {
    console.error('[Mailgun] Failed to send OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}

/**
 * Send email verification link to claimant
 * Used when campaign requires email verification
 */
export async function sendClaimVerificationEmail(
  email: string,
  verificationLink: string,
  campaignTitle?: string
): Promise<void> {
  const mg = getMailgunClient();
  const domain = process.env.MAILGUN_DOMAIN!;
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || `noreply@${domain}`;

  const subject = `Verify your email for ${campaignTitle || 'your claim'}`;
  const text = `
Please verify your email address by clicking the link below:

${verificationLink}

This link will expire in 24 hours.

${campaignTitle ? `Campaign: ${campaignTitle}` : ''}

If you didn't request this, please ignore this email.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0;">
    <h2 style="color: #1a1a1a; margin-top: 0;">Verify Your Email</h2>
    <p>Please verify your email address to confirm your claim.</p>
    ${campaignTitle ? `<p><strong>${campaignTitle}</strong></p>` : ''}
    <div style="margin: 30px 0; text-align: center;">
      <a href="${verificationLink}" style="display: inline-block; background-color: #4a90e2; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
        Verify Email
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #4a90e2; font-size: 12px;">${verificationLink}</p>
    <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
  </div>
</body>
</html>
  `.trim();

  try {
    await mg.messages.create(domain, {
      from: fromEmail,
      to: [email],
      subject,
      text,
      html,
    });

    console.log(`[Mailgun] Verification email sent to ${email}`);
  } catch (error) {
    console.error('[Mailgun] Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send gift confirmation email to recipient
 * Includes gifter info and personal note
 */
export async function sendGiftConfirmationEmail(
  email: string,
  campaignTitle: string,
  gifterName: string,
  gifterLinkedIn?: string | null,
  giftNote?: string | null
): Promise<void> {
  const mg = getMailgunClient();
  const domain = process.env.MAILGUN_DOMAIN!;
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || `noreply@${domain}`;

  const subject = `Your book from ${gifterName} is on its way!`;
  const text = `
Great news! Your book claim has been confirmed.

${giftNote ? `${gifterName} says: "${giftNote}"` : `${gifterName} has gifted you a book!`}

${gifterLinkedIn ? `Connect with ${gifterName} on LinkedIn: ${gifterLinkedIn}` : ''}

Campaign: ${campaignTitle}

Your book will be shipped to the address you provided. Thank you!
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0;">
    <h2 style="color: #1a1a1a; margin-top: 0;">Your Book is On Its Way!</h2>

    <div style="background-color: #f3e8ff; border-left: 4px solid #9333ea; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
      <p style="margin: 0; font-weight: bold; color: #581c87;">A gift from ${gifterName}</p>
      ${giftNote ? `<p style="margin: 10px 0 0 0; font-style: italic; color: #6b21a8;">"${giftNote}"</p>` : ''}
      ${gifterLinkedIn ? `<p style="margin: 10px 0 0 0;"><a href="${gifterLinkedIn}" style="color: #7c3aed;">Connect on LinkedIn →</a></p>` : ''}
    </div>

    <p>Your claim for <strong>${campaignTitle}</strong> has been confirmed.</p>
    <p>Your book will be shipped to the address you provided.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">Thank you for being part of this!</p>
  </div>
</body>
</html>
  `.trim();

  try {
    await mg.messages.create(domain, {
      from: fromEmail,
      to: [email],
      subject,
      text,
      html,
    });

    console.log(`[Mailgun] Gift confirmation email sent to ${email}`);
  } catch (error) {
    console.error('[Mailgun] Failed to send gift confirmation email:', error);
    throw new Error('Failed to send gift confirmation email');
  }
}

/**
 * Send invite email to new admin user
 * Used when a super admin invites a new user
 */
export async function sendInviteEmail(
  email: string,
  name: string,
  role: string
): Promise<void> {
  const mg = getMailgunClient();
  const domain = process.env.MAILGUN_DOMAIN!;
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || `noreply@${domain}`;
  const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const loginUrl = `${appUrl}/admin/login`;

  const roleDisplay = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Viewer';

  const subject = 'Welcome to Claim Your Cognitive Kin Admin';
  const text = `
Hi ${name},

You've been invited to join Claim Your Cognitive Kin as an ${roleDisplay}.

To get started, visit the admin login page:
${loginUrl}

Enter your email address (${email}) and you'll receive a one-time login code.

Your role: ${roleDisplay}
${role === 'super_admin' ? '- Full access, can manage users and all campaigns' : ''}
${role === 'admin' ? '- Can create campaigns and edit your own campaigns' : ''}
${role === 'viewer' ? '- Read-only access to all campaigns' : ''}

If you have any questions, please contact the administrator who invited you.

Welcome aboard!
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0;">
    <h2 style="color: #1a1a1a; margin-top: 0;">Welcome to AddressCollect</h2>
    <p>Hi ${name},</p>
    <p>You've been invited to join AddressCollect as an <strong>${roleDisplay}</strong>.</p>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${loginUrl}" style="display: inline-block; background-color: #4a90e2; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
        Login to Admin
      </a>
    </div>

    <p>To get started:</p>
    <ol style="color: #666;">
      <li>Click the button above to visit the admin login page</li>
      <li>Enter your email address: <strong>${email}</strong></li>
      <li>You'll receive a one-time login code</li>
    </ol>

    <div style="background-color: #ffffff; border-left: 4px solid #4a90e2; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>Your Role: ${roleDisplay}</strong></p>
      ${role === 'super_admin' ? '<p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Full access, can manage users and all campaigns</p>' : ''}
      ${role === 'admin' ? '<p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Can create campaigns and edit your own campaigns</p>' : ''}
      ${role === 'viewer' ? '<p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Read-only access to all campaigns</p>' : ''}
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">If you have any questions, please contact the administrator who invited you.</p>
  </div>
</body>
</html>
  `.trim();

  try {
    await mg.messages.create(domain, {
      from: fromEmail,
      to: [email],
      subject,
      text,
      html,
    });

    console.log(`[Mailgun] Invite email sent to ${email} (${role})`);
  } catch (error) {
    console.error('[Mailgun] Failed to send invite email:', error);
    throw new Error('Failed to send invite email');
  }
}
