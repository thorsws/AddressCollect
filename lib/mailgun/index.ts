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
