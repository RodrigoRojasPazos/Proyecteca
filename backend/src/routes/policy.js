import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { getAccessPolicy, updateAccessPolicy } from '../controllers/accessPolicyController.js';

const router = express.Router();

// Solo directores pueden ver/editar la política
router.get('/access-policy', authenticateToken, requireRole(['director']), getAccessPolicy);
router.put('/access-policy', authenticateToken, requireRole(['director']), updateAccessPolicy);

export default router;