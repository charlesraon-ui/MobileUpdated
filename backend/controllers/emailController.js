import nodemailer from "nodemailer";

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user, pass },
  });
}

export async function sendWelcomeEmail({ to, name }) {
  try {
    const transporter = buildTransport();
    if (!transporter) {
      console.warn("EMAIL_DISABLED: SMTP env not configured");
      return { ok: false, disabled: true };
    }
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
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
    const transporter = buildTransport();
    if (!transporter) {
      console.warn("EMAIL_DISABLED: SMTP env not configured");
      return { ok: false, disabled: true };
    }
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
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
    const transporter = buildTransport();
    if (!transporter) {
      console.warn("EMAIL_DISABLED: SMTP env not configured");
      return { ok: false, disabled: true };
    }
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const subject = "Reset your GoAgriTrading password";
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
    await transporter.sendMail({ from, to, subject, text, html });
    return { ok: true };
  } catch (e) {
    console.error("SEND_RESET_EMAIL_ERROR:", e?.message || e);
    return { ok: false, error: e?.message || String(e) };
  }
}