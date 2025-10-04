// server.js
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import compression from "compression";

// --- route imports (models first if they add hooks) ---
import "./models/Driver.js";
import "./models/Vehicle.js";

// Customer-only app - no admin routes
import authRoutes from "./routes/authRoutes.js";
import bundleRoutes from "./routes/bundleRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import loyaltyRoutes from "./routes/loyaltyRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import recommendRoutes from "./routes/recommendRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// ──────────────────────────────────────────────────────
const app = express();
const PORT = Number(process.env.PORT) || 5000; // Render sets PORT

// middleware
app.set("trust proxy", 1); // Render runs behind a proxy
app.use(helmet());
app.use(compression());
app.use(express.json());

// Robust CORS: allow list from comma-separated env, support "*" and no-origin requests (mobile/curl)
const allowList = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // mobile app / curl
    if (allowList.length === 0 || allowList.includes("*") || allowList.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// health + root
app.get("/health", (_, res) => res.status(200).send("ok"));
app.get("/healthz", (_, res) => res.status(200).send("ok"));
app.get("/", (_, res) => res.send("GoAgriTrading backend up"));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/recommendations", recommendRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/payment", paymentRoutes); // (if you really need this alias)
app.use("/api/bundles", bundleRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/notifications", notificationRoutes);
// Customer-only app - no admin loyalty routes


// db + start server (start AFTER DB connects)
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose v7+ ignores deprecated opts; these are safe defaults
      maxPoolSize: 10,
    });
    console.log("✅ MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ API listening on ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err?.message || err);
    // Keep process alive so /health can still answer while you debug:
    // If you prefer hard fail: process.exit(1);
  }
};
start();

// Optional: catch unhandled errors to avoid silent crashes
process.on("unhandledRejection", (e) => console.error("UnhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("UncaughtException:", e));
