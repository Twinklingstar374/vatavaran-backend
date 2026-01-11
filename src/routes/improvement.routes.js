import express from "express";
import { createImprovementSuggestion, getAllImprovementSuggestions } from "../controllers/improvement.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public route to submit improvement suggestion
router.post("/", createImprovementSuggestion);

// Protected route for Admins to view suggestions
router.get("/", verifyToken, authorizeRoles("ADMIN"), getAllImprovementSuggestions);

export default router;
