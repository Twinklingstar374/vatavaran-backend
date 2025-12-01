// backend/index.js (ESM Compatible)

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import authRouter from "./src/routes/auth.routes.js";
import pickupsRouter from "./src/routes/pickups.routes.js";
import { errorHandler, notFoundHandler } from "./src/middleware/error.middleware.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

const app = express();
const prisma = new PrismaClient();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://vatavaranapp.vercel.app",
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("Blocked origin:", origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}

// Auth middleware (for protected route example)
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Routes
app.use("/api/auth", authRouter);
app.use("/api/pickups", pickupsRouter);

// Protected route example
app.get("/api/protected", authMiddleware, async (req, res) => {
  try {
    const userDetails = await prisma.staff.findUnique({
      where: { id: req.user.id },
      select: { name: true, role: true, supervisorId: true }
    });

    if (!userDetails) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({
      message: "Access granted",
      user: { id: req.user.id, ...userDetails }
    });
  } catch (error) {
    console.error("Protected route error:", error);
    res.status(500).json({ message: "Server error fetching user data." });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VatavaranTrack API Server Running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      pickups: "/api/pickups"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ success: true, status: "healthy", timestamp: new Date().toISOString() });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/`);
});
