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
import refundTicketRoutes from "./routes/refundTickets.js";
import messageRoutes from "./routes/messageRoutes.js";
import directMessageRoutes from "./routes/directMessageRoutes.js";
import userRoutes from "./routes/userRoutes.js";

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
app.use("/api/refund-tickets", refundTicketRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dm", directMessageRoutes);
app.use("/api/users", userRoutes);
// Customer-only app - no admin loyalty routes


// db + start server (start regardless, warn if DB is down)
const start = async () => {
  let dbConnected = false;
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goagri";
  try {
    await mongoose.connect(uri, { maxPoolSize: 10 });
    dbConnected = true;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err?.message || err);
    console.warn("⚠️ Starting API without DB connection. Set MONGO_URI in .env.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ API listening on ${PORT}`);
    if (!dbConnected) console.warn("⚠️ API running, but DB is not connected.");
  });
};
start();

// Optional: catch unhandled errors to avoid silent crashes
process.on("unhandledRejection", (e) => console.error("UnhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("UncaughtException:", e));
