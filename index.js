import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import authRouter from "./src/routes/auth.routes.js";
import pickupsRouter from "./src/routes/pickups.routes.js";
import contactRouter from "./src/routes/contact.routes.js";
import improvementRouter from "./src/routes/improvement.routes.js";
import aiRouter from "./src/routes/ai.routes.js";
import { errorHandler, notFoundHandler } from "./src/middleware/error.middleware.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

const app = express();
const prisma = new PrismaClient();

/* -------------------- CORS FIX -------------------- */

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "https://vatavaranapp.vercel.app",
  "https://vatavaran-backend.onrender.com"
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Allow any localhost origin
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ BLOCKED ORIGIN:", origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
};

app.use(cors(corsOptions));

/* -------------------- BODY PARSER -------------------- */

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* -------------------- ROUTES -------------------- */

app.use("/api/auth", authRouter);
app.use("/api/pickups", pickupsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/improvement", improvementRouter);
app.use("/api/ai", aiRouter);

/* -------------------- HEALTH CHECK -------------------- */

app.get("/", (req, res) => {
  res.json({ success: true, message: "API running" });
});

/* -------------------- NOT FOUND / ERROR HANDLERS -------------------- */

app.use(notFoundHandler);
app.use(errorHandler);

/* -------------------- START SERVER -------------------- */

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
