import express from 'express';
import { googleLogin, verifyToken, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/google', googleLogin);
router.get('/verify', authenticateToken, verifyToken);
router.post('/logout', authenticateToken, logout);

export default router;