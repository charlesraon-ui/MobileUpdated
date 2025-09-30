// server.js
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

// --- route imports ---
import "./models/Driver.js";
import "./models/Vehicle.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import recommendRoutes from "./routes/recommendRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

dotenv.config();
const app = express();

// --- middleware ---
app.use(cors({ origin: [
    'http://localhost:8081',        // Expo dev
    'http://192.168.100.130:1000',  // Your LAN IP
    'exp://192.168.100.130:8081'    // Expo protocol
  ], credentials: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json());

// --- health check ---
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API is running 🚀" });
});
app.get("/api/ping", (req, res) => res.json({ ok: true, t: Date.now() }));

// --- routes ---
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/recommendations", recommendRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/payment", paymentRoutes);

// --- connect DB ---
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
