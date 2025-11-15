// backend/server.js (ESM Compatible)

import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import authRouter from "./src/routes/auth.routes.js";

// Load environment variables
dotenv.config();

// CONSTANTS
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

// Express app + Prisma
const app = express();
const prisma = new PrismaClient();

// ===== CORS CONFIGURATION =====
app.use((req, res, next) => {
  const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";
  
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// ===== JSON Body Parser =====
app.use(express.json());

// ===== AUTH MIDDLEWARE =====
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

// ===== ROUTES =====
app.use("/api/auth", authRouter);

// PROTECTED TEST ROUTE
app.get("/protected", authMiddleware, async (req, res) => {
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

// HEALTH ROUTE
app.get("/", (req, res) => {
  res.send("Auth Server Running. Visit /api/auth/login or /api/auth/signup");
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
