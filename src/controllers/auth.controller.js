// backend/src/controllers/auth.controller.js

import prisma from '../services/db.service.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


const SALT_ROUNDS = 10;


function generateToken(user) {
    const JWT_SECRET = process.env.JWT_SECRET || 'vatavaran_fallback_secret_2024';
    const payload = { id: user.id, email: user.email, role: user.role };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// Public Signup - Always creates STAFF
export async function registerUser(req, res) {
    console.log('Register User Request Body:', req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    try {
        const existingUser = await prisma.staff.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

       
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const newUser = await prisma.staff.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'STAFF' // Force STAFF role for public signup
            }
        });

        
        const token = generateToken(newUser);

       
        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name, rewardPoints: newUser.rewardPoints || 0 }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error during registration.' });
    }
}

// Admin Only - Create User with specific role
export async function createUser(req, res) {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    if (!['STAFF', 'SUPERVISOR', 'ADMIN'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Allowed: STAFF, SUPERVISOR, ADMIN.' });
    }

    try {
        const existingUser = await prisma.staff.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const newUser = await prisma.staff.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role
            }
        });

        return res.status(201).json({
            message: 'User created successfully',
            user: { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name, rewardPoints: newUser.rewardPoints || 0 }
        });
    } catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ message: 'Internal server error creating user.' });
    }
}


export async function loginUser(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await prisma.staff.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

       
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

       
        const token = generateToken(user);

       
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role, rewardPoints: user.rewardPoints || 0 }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error during login.' });
    }
}

export async function getCurrentUser(req, res) {
    try {
        const userId = req.user.id;
        const user = await prisma.staff.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, rewardPoints: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
