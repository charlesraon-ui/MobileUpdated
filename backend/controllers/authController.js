// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

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

