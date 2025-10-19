// server.js
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import compression from "compression";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

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
import wishlistRoutes from "./routes/wishlistRoutes.js";

// ──────────────────────────────────────────────────────
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
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
app.use("/api/wishlist", wishlistRoutes);
// Customer-only app - no admin loyalty routes

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.sub || decoded.userId;
    
    socket.userId = userId;
    socket.userEmail = decoded.email;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  // Join user to their personal room for notifications
  socket.join(`user_${socket.userId}`);
  
  // Join direct message room
  socket.on('join_dm_room', (otherUserId) => {
    const roomId = [socket.userId, otherUserId].sort().join('_');
    socket.join(`dm_${roomId}`);
    console.log(`User ${socket.userId} joined DM room: dm_${roomId}`);
  });
  

  
  // Leave direct message room
  socket.on('leave_dm_room', (otherUserId) => {
    const roomId = [socket.userId, otherUserId].sort().join('_');
    socket.leave(`dm_${roomId}`);
    console.log(`User ${socket.userId} left DM room: dm_${roomId}`);
  });
  

  
  // Handle typing indicators for DMs
  socket.on('typing_dm', ({ otherUserId, isTyping }) => {
    const roomId = [socket.userId, otherUserId].sort().join('_');
    socket.to(`dm_${roomId}`).emit('user_typing_dm', {
      userId: socket.userId,
      isTyping
    });
  });
  

  
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Make io available to controllers
app.set('io', io);


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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ API listening on ${PORT}`);
    console.log(`✅ Socket.IO server ready`);
    if (!dbConnected) console.warn("⚠️ API running, but DB is not connected.");
  });
};
start();

// Optional: catch unhandled errors to avoid silent crashes
process.on("unhandledRejection", (e) => console.error("UnhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("UncaughtException:", e));
