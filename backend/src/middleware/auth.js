import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    //console.log('No se proporcionó token de acceso');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    //console.log('Verificando token JWT...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //console.log('Token decodificado:', decoded);
    
    const user = await User.findByPk(decoded.id_usuario || decoded.id);
    
    if (!user) {
      //console.log('Usuario no encontrado para el token');
      return res.status(401).json({ message: 'Invalid token or user not found' });
    }

    //console.log('Usuario autenticado:', user.correo);
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ 
      message: 'Invalid token', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

// Middleware específico para archivos que acepta token en header o query parameter
export const authenticateTokenForFile = async (req, res, next) => {
  // Intentar obtener token del header primero
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.split(' ')[1]) {
    token = authHeader.split(' ')[1];
  }
  
  // Si no hay token en header, intentar obtenerlo del query parameter
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    //console.log('No se proporcionó token de acceso para archivo');
    return res.status(401).json({ message: 'Access token required for file access' });
  }

  try {
    //console.log('Verificando token JWT para archivo...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //console.log('Token decodificado para archivo:', decoded);
    
    const user = await User.findByPk(decoded.id_usuario || decoded.id);
    
    if (!user) {
      //console.log('Usuario no encontrado para el token de archivo');
      return res.status(401).json({ message: 'Invalid token or user not found' });
    }

    //console.log('Usuario autenticado para archivo:', user.correo);
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error for file:', error);
    return res.status(403).json({ 
      message: 'Invalid token for file access', 
      error: error.message 
    });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};