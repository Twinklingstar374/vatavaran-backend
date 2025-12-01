// backend/src/routes/auth.routes.js

import express from 'express';
import { registerUser, loginUser, createUser } from '../controllers/auth.controller.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.middleware.js';

const authRouter = express.Router();

// POST /api/auth/signup - User registration (Public, STAFF only)
authRouter.post('/signup', registerUser);

// POST /api/auth/login - User login
authRouter.post('/login', loginUser);

// POST /api/auth/create-user - Admin create user (Protected, Admin only)
authRouter.post('/create-user', verifyToken, authorizeRoles('ADMIN'), createUser);

export default authRouter;
