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

/* -------------------- CORS FIX -------------------- */

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://vatavaranapp.vercel.app",
  "https://vatavaran-backend.onrender.com"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ BLOCKED ORIGIN:", origin);
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

/* -------------------- BODY PARSER -------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- ROUTES -------------------- */

app.use("/api/auth", authRouter);
app.use("/api/pickups", pickupsRouter);

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
