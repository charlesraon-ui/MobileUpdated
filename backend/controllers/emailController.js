import nodemailer from "nodemailer";
import twilio from "twilio";
import sgMail from "@sendgrid/mail";

function getEmailEnv() {
  const profile = (process.env.SMTP_PROFILE || "primary").toLowerCase();
  const isSecondary = profile === "secondary";
  const host = isSecondary ? (process.env.SMTP2_HOST || process.env.SMTP_HOST) : process.env.SMTP_HOST;
  const portRaw = isSecondary ? (process.env.SMTP2_PORT || process.env.SMTP_PORT) : process.env.SMTP_PORT;
  const port = Number(portRaw || 587);
  const user = isSecondary ? (process.env.SMTP2_USER || process.env.SMTP_USER) : process.env.SMTP_USER;
  const pass = isSecondary ? (process.env.SMTP2_PASS || process.env.SMTP_PASS) : process.env.SMTP_PASS;
  const mailFrom = isSecondary ? (process.env.MAIL_FROM2 || process.env.MAIL_FROM || user) : (process.env.MAIL_FROM || user);
  const sgApiKey = isSecondary ? (process.env.SENDGRID2_API_KEY || process.env.SENDGRID_API_KEY) : process.env.SENDGRID_API_KEY;
  const replyTo = isSecondary ? (process.env.MAIL_REPLY_TO2 || process.env.MAIL_REPLY_TO || mailFrom) : (process.env.MAIL_REPLY_TO || mailFrom);
  return { smtp: { host, port, user, pass }, mailFrom, sgApiKey, replyTo, profile };
}

function buildTransport(env) {
  const { host, port, user, pass } = env.smtp || {};
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

export async function sendWelcomeEmail({ to, name }) {
  try {
    const cfg = getEmailEnv();
    const transporter = buildTransport(cfg);
    if (!transporter) {
      console.warn("EMAIL_DISABLED: SMTP env not configured");
      return { ok: false, disabled: true };
    }
    const from = cfg.mailFrom;
    const subject = "Welcome to GoAgriTrading";
    const text = `Hello ${name || "there"},\n\nYour account has been created successfully.\n\nHappy shopping!`;
    const html = `
      <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
        <h2>Welcome to GoAgriTrading</h2>
        <p>Hello ${name || "there"},</p>
        <p>Your account has been created successfully.</p>
        <p>Happy shopping!</p>
      </div>
    `;
    await transporter.sendMail({ from, to, subject, text, html });
    return { ok: true };
  } catch (e) {
    console.error("SEND_WELCOME_EMAIL_ERROR:", e?.message || e);
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function sendRegistrationVerificationEmail({ to, name, verifyUrl }) {
  try {
    const cfg = getEmailEnv();
    const transporter = buildTransport(cfg);
    if (!transporter) {
      console.warn("EMAIL_DISABLED: SMTP env not configured");
      return { ok: false, disabled: true };
    }
    const from = cfg.mailFrom;
    const subject = "Confirm your GoAgriTrading account";
    const text = `Hello ${name || "there"},\n\nPlease confirm account creation by opening this link:\n${verifyUrl}\n\nIf you did not request this, ignore this email.`;
    const html = `
      <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
        <h2>Confirm your account</h2>
        <p>Hello ${name || "there"},</p>
        <p>Please confirm account creation by clicking the button below.</p>
        <p style="margin:20px 0;">
          <a href="${verifyUrl}" style="background:#0ea5e9;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;">Confirm Account</a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `;
    await transporter.sendMail({ from, to, subject, text, html });
    return { ok: true };
  } catch (e) {
    console.error("SEND_VERIFY_EMAIL_ERROR:", e?.message || e);
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  try {
    const cfg = getEmailEnv();
    const from = cfg.mailFrom;
    const subject = "GoAgriTrading: Password reset link";
    const text = `Hello ${name || "there"},\n\nYou requested to reset your password. Open this link to proceed:\n${resetUrl}\n\nIf you did not request this, ignore this email.`;
    const html = `
      <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
        <h2>Reset your password</h2>
        <p>Hello ${name || "there"},</p>
        <p>You requested to reset your password. Click the button below to continue.</p>
        <p style="margin:20px 0;">
          <a href="${resetUrl}" style="background:#ea580c;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;">Reset Password</a>
        </p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    const transporter = buildTransport(cfg);
    if (transporter && from) {
      try {
        await transporter.sendMail({ from, to, subject, text, html });
        return { ok: true };
      } catch (smtpErr) {
        console.warn("SMTP_SEND_FAILED:", smtpErr?.message || smtpErr);
      }
    } else {
      console.warn("EMAIL_DISABLED: SMTP env not configured");
    }

    const sgApiKey = cfg.sgApiKey;
    if (!sgApiKey || !from) {
      console.warn("SENDGRID_DISABLED: missing SENDGRID_API_KEY or MAIL_FROM");
      return { ok: false, disabled: true };
    }
    try {
      sgMail.setApiKey(sgApiKey);
      await sgMail.send({
        to,
        from: { email: from, name: "GoAgriTrading" },
        subject,
        text,
        html,
        categories: ["password_reset"],
      });
      return { ok: true };
    } catch (e) {
      console.error("SENDGRID_SEND_ERROR:", e?.message || e);
      return { ok: false, error: e?.message || String(e) };
    }
  } catch (e) {
    console.error("SEND_RESET_EMAIL_ERROR:", e?.message || e);
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function sendRegistrationOtpEmail({ to, name, otpCode, ttlMinutes }) {
  try {
    const cfg = getEmailEnv();
    const transporter = buildTransport(cfg);
    const from = cfg.mailFrom;
    if (!from) {
      console.warn("MAIL_FROM not set: please configure a verified sender email");
    }
    const subject = "Your GoAgriTrading verification code";
    const text = `Hello ${name || "there"},\n\nYour verification code is: ${otpCode}\nIt expires in ${ttlMinutes} minutes.\n\nEnter this code in the app to complete registration.`;
    const html = `
      <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
        <h2>Verification Code</h2>
        <p>Hello ${name || "there"},</p>
        <p>Your verification code is:</p>
        <p style="font-size:24px;font-weight:700;letter-spacing:2px;">${otpCode}</p>
        <p>This code expires in ${ttlMinutes} minutes.</p>
        <p>Enter this code in the app to complete registration.</p>
      </div>
    `;
    if (transporter && from) {
      try {
        await transporter.sendMail({ from, to, subject, text, html });
        return { ok: true };
      } catch (smtpErr) {
        console.warn("SMTP_SEND_FAILED:", smtpErr?.message || smtpErr);
      }
    }

    const sgApiKey = cfg.sgApiKey;
    if (!sgApiKey || !from) {
      console.warn("SENDGRID_DISABLED: missing SENDGRID_API_KEY or MAIL_FROM");
      return { ok: false, disabled: true };
    }
    try {
      sgMail.setApiKey(sgApiKey);
      await sgMail.send({
        to,
        from: { email: from, name: "GoAgriTrading" },
        subject,
        text,
        html,
        categories: ["registration_otp"],
        trackingSettings: {
          clickTracking: { enable: false, enableText: false },
          openTracking: { enable: false },
        },
        replyTo: cfg.replyTo,
      });
      return { ok: true };
    } catch (e) {
      console.error("SENDGRID_SEND_ERROR:", e?.message || e);
      return { ok: false, error: e?.message || String(e) };
    }
  } catch (e) {
    console.error("SEND_OTP_EMAIL_ERROR:", e?.message || e);
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function sendRegistrationOtpSms({ to, otpCode, ttlMinutes }) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!accountSid || !authToken || !from) {
      console.warn("SMS_DISABLED: Twilio env not configured");
      return { ok: false, disabled: true };
    }

    const client = twilio(accountSid, authToken);
    const body = `Your GoAgriTrading code is ${otpCode}. Expires in ${ttlMinutes} minutes.`;
    await client.messages.create({ body, from, to });
    return { ok: true };
  } catch (e) {
    console.error("SEND_OTP_SMS_ERROR:", e?.message || e);
    return { ok: false, error: e?.message || String(e) };
  }
}