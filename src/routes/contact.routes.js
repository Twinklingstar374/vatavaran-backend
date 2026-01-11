import express from "express";
import { createContactMessage, getAllContactMessages } from "../controllers/contact.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public route to submit contact message
router.post("/", createContactMessage);

// Protected route for Admins to view messages
router.get("/", verifyToken, authorizeRoles("ADMIN"), getAllContactMessages);

export default router;
