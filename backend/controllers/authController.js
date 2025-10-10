// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendWelcomeEmail, sendRegistrationVerificationEmail, sendPasswordResetEmail } from "./emailController.js";
import { v4 as uuidv4 } from "uuid";
import PendingRegistration from "../models/PendingRegistration.js";
import PasswordReset from "../models/PasswordReset.js";

const JWT_EXPIRES = "7d";

export async function register(req, res) {
  try {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash: hash,
    });

  const token = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES,
    });

    // Fire-and-forget: send welcome/notification email
    try {
      await sendWelcomeEmail({ to: user.email, name: user.name });
    } catch (e) {
      console.warn("WELCOME_EMAIL_SEND_FAILED:", e?.message);
    }

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Support legacy records: prefer passwordHash, but fall back to `password` if present
    const hash = user.passwordHash || user.password || "";
    let ok = false;
    try {
      // If hash looks like bcrypt (starts with $2), compare using bcrypt
      if (typeof hash === "string" && hash.startsWith("$2")) {
        ok = await bcrypt.compare(password, hash);
      } else {
        // Fallback: plain equality (legacy plaintext); consider migrating immediately
        ok = typeof hash === "string" && hash.length > 0 && password === hash;
      }
    } catch (cmpErr) {
      console.error("LOGIN_COMPARE_ERROR:", cmpErr?.message || cmpErr);
      return res.status(500).json({ message: "Auth compare failed" });
    }

    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES,
    });

    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Google OAuth authentication: accepts an access token, validates with Google,
// then logs in or creates the user and returns a JWT.
export async function googleAuth(req, res) {
  try {
    const { accessToken } = req.body ?? {};
    if (!accessToken) {
      return res.status(400).json({ message: "accessToken is required" });
    }

    // Validate token and get userinfo from Google
    const gRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!gRes.ok) {
      const text = await gRes.text();
      return res.status(401).json({ message: "Invalid Google token", details: text });
    }
    const info = await gRes.json();
    const email = String(info?.email || "").toLowerCase().trim();
    const name = String(info?.name || info?.given_name || "User").trim();
    if (!email) return res.status(400).json({ message: "Google email not available" });

    // Find or create
    let user = await User.findOne({ email });
    if (!user) {
      const randomSecret = uuidv4();
      const hash = await bcrypt.hash(randomSecret, 10);
      user = await User.create({ name, email, passwordHash: hash });

      // Fire-and-forget welcome email
      try {
        await sendWelcomeEmail({ to: user.email, name: user.name });
      } catch (e) {
        console.warn("WELCOME_EMAIL_SEND_FAILED:", e?.message);
      }
    }

    const token = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES,
    });

    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
      provider: "google",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Initiate email-based account creation: store pending registration and send verification email
export async function initiateRegistration(req, res) {
  try {
    const { name, email, password, address } = req.body ?? {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const token = uuidv4();
    const ttlMinutes = Number(process.env.REG_VERIFY_TTL_MIN || 60); // default 60m
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await PendingRegistration.deleteMany({ email: normalizedEmail }); // invalidate prior requests
    await PendingRegistration.create({
      email: normalizedEmail,
      name,
      address: address || "",
      passwordHash: hash,
      token,
      expiresAt,
    });

    const baseUrl = process.env.APP_BASE_URL || process.env.API_URL || "http://localhost:5000";
    const verifyUrl = `${baseUrl}/api/auth/register/confirm?token=${encodeURIComponent(token)}`;

    try {
      await sendRegistrationVerificationEmail({ to: normalizedEmail, name, verifyUrl });
    } catch (e) {
      console.warn("VERIFY_EMAIL_SEND_FAILED:", e?.message);
    }

    res.status(202).json({ message: "Verification email sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Confirm email-based account creation; create user and redirect back to app
export async function confirmRegistration(req, res) {
  try {
    const token = String(req.query?.token || "").trim();
    if (!token) return res.status(400).send("Missing token");

    const pending = await PendingRegistration.findOne({ token });
    if (!pending) return res.status(404).send("Token not found or already used");
    if (pending.expiresAt < new Date()) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(410).send("Verification link expired");
    }

    // Ensure not already registered
    const existing = await User.findOne({ email: pending.email });
    if (existing) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(409).send("Email already registered");
    }

    // Create user
    const user = await User.create({
      name: pending.name,
      email: pending.email,
      passwordHash: pending.passwordHash,
    });

    await PendingRegistration.deleteOne({ _id: pending._id });

    const jwtToken = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES,
    });

    // Decide redirect target: prefer web app during development
    const appWebUrl = process.env.APP_WEB_URL || "http://localhost:8081/login";
    const redirectUrl = `${appWebUrl}?verified=1&email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(jwtToken)}`;

    // Return a simple HTML that attempts to open the app and then falls back to web
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Account Confirmed</title></head>
        <body style="font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
          <h2>Account confirmed</h2>
          <p>Your account for ${user.email} is ready.</p>
          <p>Redirecting you back to the app…</p>
          <script>
            (function(){
              try {
                // Try deep link (for native)
                var scheme = 'goagritrading://auth?token=${jwtToken}';
                window.location.href = scheme;
              } catch(e) {}
              // Fallback to web
              setTimeout(function(){ window.location.href = '${redirectUrl}'; }, 500);
            })();
          </script>
          <p>If you are not redirected automatically, <a href="${redirectUrl}">tap here</a>.</p>
        </body>
      </html>`);
  } catch (err) {
    res.status(500).send("Server error");
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Forgot password flow
// 1) POST /password/forgot -> issue token and email link
// 2) GET  /password/reset?token=... -> simple redirect page (optional)
// 3) POST /password/reset -> consume token and update password

export async function forgotPassword(req, res) {
  try {
    const emailRaw = String(req.body?.email || "");
    const email = emailRaw.toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "email is required" });

    const user = await User.findOne({ email });
    // Always return 202 to avoid email enumeration
    if (!user) return res.status(202).json({ message: "If the email exists, a reset link was sent" });

    // Invalidate prior tokens for this email
    await PasswordReset.deleteMany({ email });

    const token = uuidv4();
    const ttlMinutes = Number(process.env.RESET_TTL_MIN || 30);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await PasswordReset.create({ email, token, expiresAt });

    const baseUrl = process.env.APP_BASE_URL || process.env.API_URL || "http://localhost:5000";
    const resetUrl = `${baseUrl}/api/auth/password/reset?token=${encodeURIComponent(token)}`;

    try {
      await sendPasswordResetEmail({ to: email, name: user.name, resetUrl });
    } catch (e) {
      console.warn("RESET_EMAIL_SEND_FAILED:", e?.message);
    }

    return res.status(202).json({ message: "If the email exists, a reset link was sent" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function resetPasswordRedirect(req, res) {
  try {
    const token = String(req.query?.token || "").trim();
    if (!token) return res.status(400).send("Missing token");

    const pr = await PasswordReset.findOne({ token });
    if (!pr) return res.status(404).send("Invalid or used token");
    if (pr.used) return res.status(409).send("Token already used");
    if (pr.expiresAt < new Date()) return res.status(410).send("Reset link expired");

    const appWebUrl = process.env.APP_WEB_URL || "http://localhost:8081/forgot-password";
    const redirectUrl = `${appWebUrl}?token=${encodeURIComponent(token)}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!doctype html>
      <html>
        <head><meta charset=\"utf-8\"><title>Password Reset</title></head>
        <body style=\"font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif;\">
          <h2>Password reset</h2>
          <p>Redirecting you back to the app…</p>
          <script>
            (function(){
              try {
                // Deep link to the mobile Forgot Password screen
                var scheme = 'goagritrading://forgot-password?token=${token}';
                window.location.href = scheme;
              } catch(e) {}
              // Fallback to web route if deep link is unavailable
              setTimeout(function(){ window.location.href = '${redirectUrl}'; }, 500);
            })();
          </script>
          <p>If you are not redirected automatically, <a href="${redirectUrl}">tap here</a>.</p>
        </body>
      </html>`);
  } catch (err) {
    return res.status(500).send("Server error");
  }
}

export async function resetPassword(req, res) {
  try {
    const token = String(req.body?.token || "").trim();
    const newPassword = String(req.body?.password || "");
    if (!token || !newPassword) return res.status(400).json({ message: "token and password are required" });

    const pr = await PasswordReset.findOne({ token });
    if (!pr) return res.status(404).json({ message: "Invalid token" });
    if (pr.used) return res.status(409).json({ message: "Token already used" });
    if (pr.expiresAt < new Date()) return res.status(410).json({ message: "Reset link expired" });

    const user = await User.findOne({ email: pr.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hash;
    await user.save();

    pr.used = true;
    await pr.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

