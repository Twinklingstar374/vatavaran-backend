import express from 'express';
import { 
  createPickup, 
  getMyPickups, 
  getAllPickups, 
  getPickupById,
  updatePickupStatus,
  updatePickup, 
  deletePickup 
} from '../controllers/pickups.controller.js';

import { verifyToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

/* ---------------- STAFF ROUTES ---------------- */

// Create pickup
router.post('/', verifyToken, authorizeRoles('STAFF'), createPickup);

// Get logged-in staff pickups
router.get('/my', verifyToken, authorizeRoles('STAFF'), getMyPickups);

/* ---------------- SUPERVISOR/ADMIN ROUTES ---------------- */

// List all pickups
router.get('/', verifyToken, authorizeRoles('SUPERVISOR', 'ADMIN'), getAllPickups);

/* ---------------- SHARED ROUTES ---------------- */

// Get pickup by ID (staff only their own)
router.get('/:id', verifyToken, authorizeRoles('STAFF', 'SUPERVISOR', 'ADMIN'), getPickupById);

// Update pickup (staff can edit only their pending pickup)
router.put('/:id', verifyToken, authorizeRoles('STAFF'), updatePickup);

// Supervisor/Admin can approve/reject
router.patch('/:id', verifyToken, authorizeRoles('SUPERVISOR', 'ADMIN'), updatePickupStatus);

// Staff delete their own pending pickup
router.delete('/:id', verifyToken, authorizeRoles('STAFF'), deletePickup);

export default router;

