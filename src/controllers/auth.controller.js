// backend/src/controllers/auth.controller.js

import prisma from '../services/db.service.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// --- Configuration and Constants ---
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-and-secret-key-replace-this-in-production';
const SALT_ROUNDS = 10;

/**
 * Generates a JSON Web Token (JWT) for the authenticated user.
 */
function generateToken(user) {
    const payload = { id: user.id, email: user.email };
    // Token expires in 1 hour
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Handles user registration (Sign Up).
 */
export async function registerUser(req, res) {
    console.log('Register User Request Body:', req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    try {
        // 1. Check if user already exists
        const existingUser = await prisma.staff.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // 2. Hash the password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // 3. Create and store the new user
        const newUser = await prisma.staff.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });

        // 4. Generate token for immediate login
        const token = generateToken(newUser);

        // 5. Success response (Do not return the password hash!)
        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: newUser.id, email: newUser.email }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error during registration.' });
    }
}

/**
 * Handles user login (Sign In).
 */
export async function loginUser(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // 1. Find the user by email
        const user = await prisma.staff.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 2. Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 3. Generate token
        const token = generateToken(user);

        // 4. Success response
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email ,name: user.name, role : user.role}
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error during login.' });
    }
}
