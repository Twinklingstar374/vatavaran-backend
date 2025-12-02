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
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://vatavaranapp.vercel.app",
  "https://*.vercel.app",
  "https://vatavaran-backend.onrender.com"
];

// ✅ WORKING CORS MIDDLEWARE — KEEP THIS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(o =>
      o.includes("*")
        ? new RegExp(o.replace("*", ".*")).test(origin)
        : o === origin
    );

    if (isAllowed) callback(null, true);
    else {
      console.log("❌ BLOCKED ORIGIN:", origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ❌ REMOVE THIS LINE — IT BREAKS YOUR SERVER
// app.use(cors(corsOptions));   <---- DELETE THIS

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/pickups", pickupsRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "VatavaranTrack API Running" });
});

app.get("/health", (req, res) => {
  res.json({ success: true });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
