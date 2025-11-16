import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { listExceptions, addException, bulkAddExceptions, removeException } from '../controllers/accessExceptionController.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole(['director']), listExceptions);
router.post('/', authenticateToken, requireRole(['director']), addException);
router.post('/bulk', authenticateToken, requireRole(['director']), bulkAddExceptions);
router.delete('/:id', authenticateToken, requireRole(['director']), removeException);

export default router;