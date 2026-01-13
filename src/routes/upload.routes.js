
import express from 'express';
import { uploadFile } from '../controllers/upload.controller.js';
import { upload } from '../middleware/upload.middleware.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Allow STAFF, SUPERVISOR, ADMIN to upload files
// Using 'file' as the field name for the upload
router.post('/', verifyToken, authorizeRoles('STAFF', 'SUPERVISOR', 'ADMIN'), upload.single('file'), uploadFile);

export default router;
