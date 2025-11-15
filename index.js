// backend/server.js (Your new main entry point)

const express  = require("express")

import authRouter from './src/routes/auth.routes.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'; // Needed for authMiddleware
import { PrismaClient } from '@prisma/client'; // Needed for protected route example

// Load environment variables from .env file
dotenv.config();

// --- Configuration and Constants ---
// Use the port from your old index.js (5001) for consistency
const PORT = process.env.PORT || 5001; 
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY"; // Should match the secret in controller

// --- Express Application Setup ---
const app = express();
const prisma = new PrismaClient(); // Keep here for now for simple route access

// ===== BULLETPROOF CORS (Integrated from your old index.js) =====
app.use((req, res, next) => {
  // Use environment variable for production, or hardcode localhost for development
  const allowedOrigin = "http://localhost:3000"; 
  
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    // Handle preflight request
    return res.sendStatus(204); 
  }

  next();
});

// Middleware to parse JSON request bodies
app.use(express.json());

// ===== AUTH MIDDLEWARE (Integrated from your old index.js) =====
// Note: In a larger app, this would be in its own middleware file.
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// --- Routes ---
// Mount the authentication routes under the /api/auth prefix
app.use('/api/auth', authRouter);

// ===== PROTECTED TEST API (Integrated from your old index.js) =====
app.get("/protected", authMiddleware, async (req, res) => {
  // Example of fetching user details using the ID from the token payload
  try {
    const userDetails = await prisma.staff.findUnique({
      where: { id: req.user.id },
      select: { name: true, role: true, supervisorId: true } // Select relevant fields
    });

    if (!userDetails) {
      return res.status(404).json({ message: "User not found in DB." });
    }

    res.json({ 
      message: "Access granted", 
      user: {
        id: req.user.id,
        ...userDetails
      }
    });
  } catch (error) {
    console.error("Protected route error:", error);
    res.status(500).json({ message: "Server error fetching user data." });
  }
});

// Simple unprotected test route
app.get('/', (req, res) => {
    res.send('Auth Server Running. Navigate to /api/auth/signup or /api/auth/login');
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});