// server.js
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import mongoose from "mongoose";

// --- route imports (models first if they add hooks) ---
import "./models/Driver.js";
import "./models/Vehicle.js";

import authRoutes from "./routes/authRoutes.js";
import bundleRoutes from "./routes/bundleRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import recommendRoutes from "./routes/recommendRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

// ──────────────────────────────────────────────────────
const app = express();
const PORT = Number(process.env.PORT) || 5000; // Render sets PORT

// middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
    credentials: true,
  })
);

// health + root
app.get("/health", (_, res) => res.status(200).send("ok"));
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
