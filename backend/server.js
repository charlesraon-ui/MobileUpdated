// server.js
import dotenv from "dotenv";

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
import adminBundleRoutes from "./routes/adminBundleRoutes.js";
import adminLoyaltyRoutes from "./routes/adminLoyaltyRoutes.js";
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

import userRoutes from "./routes/userRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import supportChatRoutes from "./routes/supportChatRoutes.js";
import promoRoutes from "./routes/promoRoutes.js";
import deliveryMessageRoutes from "./routes/deliveryMessageRoutes.js";
import priceAlertRoutes from "./routes/priceAlertRoutes.js";
import priceMonitoringService from "./services/priceMonitoringService.js";
dotenv.config();

// ──────────────────────────────────────────────────────
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  // Add proper timeout and connection settings
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});
const PORT = Number(process.env.PORT) || 5000; // Render sets PORT
const HOST = "0.0.0.0"; // THIS IS CRITICAL FOR RENDER

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
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // If no specific origins configured, allow all (development mode)
    if (allowList.length === 0) return callback(null, true);
    
    // Allow wildcard or specific origins
    if (allowList.includes("*") || allowList.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow localhost origins for development
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }
    
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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
app.use("/api/admin/bundles", adminBundleRoutes);
app.use("/api/admin/loyalty", adminLoyaltyRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/refund-tickets", refundTicketRoutes);
app.use("/api/messages", messageRoutes);

app.use("/api/users", userRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/support-chat", supportChatRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/delivery-messages", deliveryMessageRoutes);
app.use("/api/price-alerts", priceAlertRoutes);

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
io.on('connection', async (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  // Join user to their personal room for notifications
  socket.join(`user_${socket.userId}`);
  
  // Check if user is admin and join admin room
  try {
    const User = (await import('./models/User.js')).default;
    const user = await User.findById(socket.userId);
    if (user && ['admin', 'superadmin'].includes(user.role)) {
      socket.join('admin_room');
      socket.isAdmin = true;
      console.log(`Admin ${socket.userId} joined admin room`);
    }
  } catch (error) {
    console.error('Error checking user role:', error);
  }
  

  
  // Support chat functionality
  socket.on('join_support_room', (roomId) => {
    socket.join(`support_${roomId}`);
    console.log(`User ${socket.userId} joined support room: support_${roomId}`);
  });
  
  socket.on('leave_support_room', (roomId) => {
    socket.leave(`support_${roomId}`);
    console.log(`User ${socket.userId} left support room: support_${roomId}`);
  });
  
  // Handle typing indicators for support chat
  socket.on('typing_support', ({ roomId, isTyping }) => {
    socket.to(`support_${roomId}`).emit('user_typing_support', {
      userId: socket.userId,
      isTyping,
      isAdmin: socket.isAdmin || false
    });
  });
  
  // Delivery message functionality
  socket.on('join_delivery_room', (orderId) => {
    socket.join(`delivery_${orderId}`);
    console.log(`User ${socket.userId} joined delivery room: delivery_${orderId}`);
  });
  
  socket.on('leave_delivery_room', (orderId) => {
    socket.leave(`delivery_${orderId}`);
    console.log(`User ${socket.userId} left delivery room: delivery_${orderId}`);
  });
  
  // Handle typing indicators for delivery messages
  socket.on('typing_delivery', ({ orderId, isTyping }) => {
    socket.to(`delivery_${orderId}`).emit('user_typing_delivery', {
      userId: socket.userId,
      isTyping,
      isAdmin: socket.isAdmin || false
    });
  });
  
  // Handle new delivery message broadcast
  socket.on('new_delivery_message', (messageData) => {
    // Broadcast to all users in the delivery room for this order
    socket.to(`delivery_${messageData.orderId}`).emit('delivery_message_received', messageData);
    
    // Also notify admin room if message is from customer
    if (!socket.isAdmin && messageData.senderType === 'customer') {
      socket.to('admin_room').emit('new_customer_delivery_message', messageData);
    }
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

  server.listen(PORT, HOST, () => {
    console.log(`✅ Server is live on ${HOST}:${PORT}`);
    console.log("✅ Socket.IO server ready");
    console.log('Environment Check:', {
      nodeEnv: process.env.NODE_ENV,
      port: PORT,
      host: HOST,
      hasMongoUrl: !!process.env.MONGO_URL,
      hasMongoUri: !!process.env.MONGO_URI,
      hasLalamoveKey: !!process.env.LALAMOVE_API_KEY,
      hasLalamoveSecret: !!process.env.LALAMOVE_API_SECRET,
    });
    if (!dbConnected) console.warn("⚠️ API running, but DB is not connected.");
    
    // Start price monitoring service if DB is connected
    if (dbConnected) {
      try {
        priceMonitoringService.start();
        console.log(`✅ Price monitoring service started`);
      } catch (error) {
        console.error(`❌ Failed to start price monitoring service:`, error);
      }
    }
  });
};
start();

// Optional: catch unhandled errors to avoid silent crashes
process.on("unhandledRejection", (e) => console.error("UnhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("UncaughtException:", e));
