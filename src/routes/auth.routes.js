// backend/src/routes/auth.routes.js

import express from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller.js';

const authRouter = express.Router();

// POST /api/auth/signup - User registration
authRouter.post('/signup', registerUser);

// POST /api/auth/login - User login
authRouter.post('/login', loginUser);

export default authRouter;
