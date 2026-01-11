import express from "express";
import { classifyWaste } from "../controllers/ai.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Only authenticated staff can use AI classification
router.post("/classify", verifyToken, classifyWaste);

export default router;
