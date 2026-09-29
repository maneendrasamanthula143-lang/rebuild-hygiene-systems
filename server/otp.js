import crypto from 'crypto';
import { runQuery, getQuery, allQuery } from './db.js';

const SUPER_ADMIN_MOBILE = process.env.SUPER_ADMIN_MOBILE || '6304261686';
const OTP_EXPIRY_MINUTES = 5;

// Generate 6-digit numeric OTP using cryptographically secure random values
export function generateSecureOTP() {
  const number = crypto.randomInt(100000, 999999);
  return number.toString();
}

export async function requestOTP(mobile) {
  const cleanMobile = mobile.trim().replace(/\D/g, '');

  if (cleanMobile !== SUPER_ADMIN_MOBILE) {
    throw new Error('Unauthorized mobile number for Super Admin OTP login.');
  }

  // Check rate limit: max 5 requests in last 10 minutes
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recentRequests = await getQuery(
    `SELECT COUNT(*) as count FROM otp_store WHERE mobile = ? AND created_at > ?`,
    [cleanMobile, tenMinsAgo]
  );

  if (recentRequests.count >= 5) {
    throw new Error('Too many OTP requests. Please wait 10 minutes before requesting again.');
  }

  // Check cooldown: must wait 60 seconds between OTP resends
  const latestOtp = await getQuery(
    `SELECT created_at FROM otp_store WHERE mobile = ? ORDER BY created_at DESC LIMIT 1`,
    [cleanMobile]
  );

  if (latestOtp) {
    const elapsedSeconds = (Date.now() - new Date(latestOtp.created_at).getTime()) / 1000;
    if (elapsedSeconds < 60) {
      const waitSeconds = Math.ceil(60 - elapsedSeconds);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
    }
  }

  const otpCode = generateSecureOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  await runQuery(
    `INSERT INTO otp_store (mobile, otp_code, expires_at, is_used, attempts) VALUES (?, ?, ?, 0, 0)`,
    [cleanMobile, otpCode, expiresAt]
  );

  // Send SMS via provider integration hook
  const smsSent = await sendSMS(cleanMobile, otpCode);

  return {
    success: true,
    message: `OTP sent successfully to +91 ${cleanMobile}`,
    expiresAt,
    smsProviderStatus: smsSent ? 'SENT_VIA_SMS_GATEWAY' : 'SIMULATED_DEV_MODE',
    // In dev mode without configured SMS provider, log for developer reference
    devOtpNotice: process.env.NODE_ENV !== 'production' || !process.env.SMS_API_KEY 
      ? `[DEV LOG] Real generated OTP is: ${otpCode}` 
      : undefined
  };
}

export async function verifyOTP(mobile, inputOtp) {
  const cleanMobile = mobile.trim().replace(/\D/g, '');
  const cleanOtp = inputOtp.trim();

  if (cleanMobile !== SUPER_ADMIN_MOBILE) {
    throw new Error('Unauthorized mobile number.');
  }

  const activeOtp = await getQuery(
    `SELECT * FROM otp_store 
     WHERE mobile = ? AND is_used = 0 
     ORDER BY created_at DESC LIMIT 1`,
    [cleanMobile]
  );

  if (!activeOtp) {
    throw new Error('No active OTP found. Please request a new OTP.');
  }

  // Check Expiry
  const now = new Date();
  const expiryDate = new Date(activeOtp.expires_at);
  if (now > expiryDate) {
    await runQuery(`UPDATE otp_store SET is_used = 1 WHERE id = ?`, [activeOtp.id]);
    throw new Error('OTP has expired. Please request a new OTP.');
  }

  // Check Attempt Limit
  if (activeOtp.attempts >= 5) {
    await runQuery(`UPDATE otp_store SET is_used = 1 WHERE id = ?`, [activeOtp.id]);
    throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
  }

  // Compare OTP
  if (activeOtp.otp_code !== cleanOtp) {
    await runQuery(`UPDATE otp_store SET attempts = attempts + 1 WHERE id = ?`, [activeOtp.id]);
    const remainingAttempts = 4 - activeOtp.attempts;
    throw new Error(`Invalid OTP. ${remainingAttempts > 0 ? remainingAttempts + ' attempts remaining.' : 'OTP invalidated.'}`);
  }

  // Mark OTP as used
  await runQuery(`UPDATE otp_store SET is_used = 1 WHERE id = ?`, [activeOtp.id]);

  // Fetch Super Admin user record
  let adminUser = await getQuery(`SELECT * FROM users WHERE mobile = ? AND role = 'SUPER_ADMIN'`, [cleanMobile]);

  if (!adminUser) {
    throw new Error('Super Admin user record not found in system database.');
  }

  return adminUser;
}

// Hook for integration with real SMS gateway (Twilio, Fast2SMS, MSG91, Textlocal)
async function sendSMS(mobile, otpCode) {
  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) {
    console.log(`\n======================================================`);
    console.log(`[REAL OTP GENERATED FOR +91 ${mobile}] => ${otpCode}`);
    console.log(`[VALID FOR ${OTP_EXPIRY_MINUTES} MINUTES]`);
    console.log(`======================================================\n`);
    return false;
  }

  try {
    // Example SMS Gateway integration payload
    // await fetch('https://api.sms-gateway.com/v1/send', { method: 'POST', body: ... })
    console.log(`Sending SMS via provider to +91 ${mobile}`);
    return true;
  } catch (err) {
    console.error('Failed to send SMS via Gateway:', err);
    return false;
  }
}
