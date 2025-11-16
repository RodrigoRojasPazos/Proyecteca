import express from 'express';
import { 
  getProjects, 
  getProjectById,
  createProject, 
  updateProject, 
  deleteProject, 
  getProjectStats,
  getProjectFile 
} from '../controllers/projectController.js';
import { authenticateToken, authenticateTokenForFile, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// La mayoría de las rutas requieren autenticación
router.get('/', authenticateToken, getProjects);
router.get('/stats', authenticateToken, getProjectStats);
router.get('/:id', authenticateToken, getProjectById);
router.get('/:id/archivo', authenticateTokenForFile, getProjectFile); // Ruta para archivos con middleware especial
router.post('/', authenticateToken, upload.single('file'), createProject);
router.put('/:id', authenticateToken, upload.single('file'), updateProject);
router.delete('/:id', authenticateToken, deleteProject);

export default router;