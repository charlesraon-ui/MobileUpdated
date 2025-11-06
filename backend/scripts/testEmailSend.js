import dotenv from 'dotenv';
dotenv.config();

import { sendRegistrationOtpEmail } from '../controllers/emailController.js';

async function main() {
  const to = process.env.TEST_EMAIL_TO || process.env.MAIL_FROM || 'charlesraon@gmail.com';
  const name = 'SMTP Test';
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const ttlMinutes = 10;

  console.log('📧 Attempting to send test registration OTP email...');
  console.log('   To:', to);

  try {
    const result = await sendRegistrationOtpEmail({ to, name, otpCode, ttlMinutes });
    console.log('✅ Email send result:', result);
  } catch (err) {
    console.error('❌ Email send error:', err?.message || err);
    process.exitCode = 1;
  }
}

main();