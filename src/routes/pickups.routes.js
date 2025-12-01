import express from 'express';
import { 
  createPickup, 
  getMyPickups, 
  getAllPickups, 
  updatePickupStatus,
  updatePickup, 
  deletePickup 
} from '../controllers/pickups.controller.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Staff routes
router.post('/', verifyToken, authorizeRoles('STAFF'), createPickup);
router.get('/my', verifyToken, authorizeRoles('STAFF'), getMyPickups);
router.put('/:id', verifyToken, authorizeRoles('STAFF'), updatePickup);
router.delete('/:id', verifyToken, authorizeRoles('STAFF'), deletePickup);

// Supervisor/Admin routes
router.get('/', verifyToken, authorizeRoles('SUPERVISOR', 'ADMIN'), getAllPickups);
router.patch('/:id', verifyToken, authorizeRoles('SUPERVISOR', 'ADMIN'), updatePickupStatus);

export default router;
