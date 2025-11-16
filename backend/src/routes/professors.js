import express from 'express';
import { 
  getProfessors,
  getActiveProfessors,
  createProfessor,
  updateProfessor,
  toggleProfessorStatus
} from '../controllers/professorController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Obtener profesores activos (para selector en formularios) - público, no requiere autenticación
router.get('/active', getActiveProfessors);

// Todas las demás rutas requieren autenticación
router.use(authenticateToken);

// Las siguientes rutas requieren rol de administrador o director
router.use(requireRole(['admin', 'director']));

// CRUD de profesores
router.get('/', getProfessors);
router.post('/', createProfessor);
router.put('/:id', updateProfessor);
router.patch('/:id/toggle-status', toggleProfessorStatus);

export default router;