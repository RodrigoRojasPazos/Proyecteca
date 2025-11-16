// Suprimir warnings de deprecación específicos
process.noDeprecation = true;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import userRoutes from './routes/users.js';
import professorRoutes from './routes/professors.js';
import policyRoutes from './routes/policy.js';
import accessExceptionsRoutes from './routes/accessExceptions.js';

// Import database
import sequelize from './config/database.js';

// Import models
import './models/index.js';
// import { initializeData } from './utils/initializeData.js'; // ELIMINADO - No se necesita más
import { authenticateToken } from './middleware/auth.js';

// CORS configurado directamente en el middleware de Express

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting - más permisivo en desarrollo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // más requests en desarrollo
  skip: (req) => {
    // Saltar rate limiting para endpoints de salud y CORS test
    return req.path === '/api/health' || req.path === '/api/cors-test';
  }
});

// Middleware
app.use(limiter);
// Configuración de CORS usando el middleware cors
const corsOptions = {
  origin: function(origin, callback) {
    // Lista de orígenes permitidos desde variable de entorno o defaults
    const corsOrigins = process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173';
    const allowedOrigins = corsOrigins.split(',').map(o => o.trim()).concat([
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ]);
    
    // Permitir solicitudes sin origen (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Permitir todos los orígenes en desarrollo
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Verificar si el origen está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Rechazar otros orígenes
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  optionsSuccessStatus: 200 // Para soportar navegadores legacy
};

app.use(cors(corsOptions));

// Middleware adicional para debugging CORS
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'No Origin'}`);
  next();
});

// Configuración menos restrictiva de Helmet para desarrollo
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  crossOriginEmbedderPolicy: { policy: 'unsafe-none' },
  contentSecurityPolicy: false,
  xssFilter: true,
  hidePoweredBy: true
}));

app.use(compression());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configurar headers para evitar caché en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    next();
  });
}

// Static files - Configurar headers para PDFs
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/professors', professorRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/policy/access-exceptions', accessExceptionsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: sequelize.config.database,
    environment: process.env.NODE_ENV,
    cors: {
      origin: req.headers.origin || 'No origin',
      enabled: true
    }
  });
});

// Debug endpoint para verificar tablas
app.get('/api/debug/tables', async (req, res) => {
  try {
    const [results] = await sequelize.query("SHOW TABLES");
    res.json({
      success: true,
      tables: results,
      database: sequelize.config.database
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint para proyectos simples
app.get('/api/debug/projects', async (req, res) => {
  try {
    const { Project } = await import('./models/index.js');
    const projects = await Project.findAll({ limit: 5 });
    res.json({
      success: true,
      count: projects.length,
      projects: projects.map(p => p.toJSON())
    });
  } catch (error) {
    console.error('Debug projects error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Debug endpoint para usuarios/profesores
app.get('/api/debug/users', async (req, res) => {
  try {
    const { User } = await import('./models/index.js');
    const users = await User.findAll({
      attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol'],
      order: [['rol', 'ASC'], ['nombre', 'ASC']]
    });
    res.json({
      success: true,
      count: users.length,
      users: users.map(u => u.toJSON()),
      profesores: users.filter(u => u.rol === 'profesor').map(u => u.toJSON()),
      directores: users.filter(u => u.rol === 'director').map(u => u.toJSON()),
      alumnos: users.filter(u => u.rol === 'alumno').map(u => u.toJSON())
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint para ver la relación proyecto-profesor
app.get('/api/debug/project-details/:id', async (req, res) => {
  try {
    const { Project, User } = await import('./models/index.js');
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'profesor',
          attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol']
        }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const projectData = project.toJSON();
    res.json({
      success: true,
      project: {
        id_proyecto: projectData.id_proyecto,
        titulo: projectData.titulo,
        profesor_id: projectData.profesor_id,
        profesor: projectData.profesor,
        asignatura: projectData.asignatura,
        tecnologias: projectData.tecnologias,
        base_datos: projectData.base_datos
      }
    });
  } catch (error) {
    console.error('Debug project details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint temporal para crear el profesor Manuel Alejandro
app.post('/api/debug/create-professor', async (req, res) => {
  try {
    const { User } = await import('./models/index.js');
    
    const [profesor, created] = await User.findOrCreate({
      where: { correo: 'manuel.alejandro@upg.edu.mx' },
      defaults: {
        nombre: 'Manuel Alejandro',
        correo: 'manuel.alejandro@upg.edu.mx',
        rol: 'profesor',
        matricula: 'PROF001',
        avatar: 'https://ui-avatars.com/api/?name=Manuel+Alejandro&background=ffffff&color=f97316&size=96'
      }
    });
    
    res.json({
      success: true,
      profesor: profesor.toJSON(),
      created: created,
      message: created ? 'Profesor creado exitosamente' : 'Profesor ya existía'
    });
  } catch (error) {
    console.error('Error creating professor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta de prueba CORS
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS está configurado correctamente',
    timestamp: new Date().toISOString(),
    requestHeaders: {
      origin: req.headers.origin,
      host: req.headers.host,
      referer: req.headers.referer,
      'user-agent': req.headers['user-agent']
    },
    responseHeaders: {
      'access-control-allow-origin': res.getHeader('Access-Control-Allow-Origin'),
      'access-control-allow-methods': res.getHeader('Access-Control-Allow-Methods'),
      'access-control-allow-headers': res.getHeader('Access-Control-Allow-Headers'),
      'access-control-allow-credentials': res.getHeader('Access-Control-Allow-Credentials')
    },
    corsConfiguration: {
      origin: 'dynamic (all origins in development)',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }
  });
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error en servidor:', err);
  console.error(err.stack);
  
  // Registrar información adicional útil
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  console.error('Request Headers:', JSON.stringify(req.headers, null, 2));
  
  res.status(500).json({
    message: 'Error en el servidor',
    path: req.originalUrl,
    method: req.method,
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : { message: 'Error del servidor' }
  });
});

// Debug endpoint para verificar profesores
app.get('/api/debug/professors', async (req, res) => {
  try {
    const { User } = await import('./models/index.js');
    
    const professors = await User.findAll({
      where: { rol: 'profesor' },
      attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'isActive', 'creado_en']
    });
    
    res.json({
      success: true,
      total_professors: professors.length,
      active_professors: professors.filter(p => Boolean(p.isActive)).length,
      debug_filter: {
        raw_values: professors.map(p => ({ id: p.id_usuario, isActive: p.isActive, type: typeof p.isActive })),
        filter_result: professors.filter(p => p.isActive).length,
        boolean_filter_result: professors.filter(p => Boolean(p.isActive)).length
      },
      professors: professors
    });
  } catch (error) {
    console.error('Error fetching professors:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint para verificar un profesor específico
app.get('/api/debug/professor/:id', async (req, res) => {
  try {
    const { User } = await import('./models/index.js');
    const { id } = req.params;
    
    const professor = await User.findOne({
      where: { id_usuario: id, rol: 'profesor' },
      attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'isActive', 'creado_en']
    });
    
    if (!professor) {
      return res.status(404).json({
        success: false,
        message: 'Profesor no encontrado'
      });
    }
    
    res.json({
      success: true,
      professor: professor
    });
  } catch (error) {
    console.error('Error fetching professor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint para toggle manual
app.post('/api/debug/toggle/:id', async (req, res) => {
  try {
    const { User } = await import('./models/index.js');
    const { id } = req.params;
    
    const professor = await User.findOne({
      where: { id_usuario: id, rol: 'profesor' }
    });
    
    if (!professor) {
      return res.status(404).json({
        success: false,
        message: 'Profesor no encontrado'
      });
    }
    
    const oldStatus = professor.isActive;
    const newStatus = !oldStatus;
    
    await professor.update({ isActive: newStatus });
    
    res.json({
      success: true,
      message: `Estado actualizado de ${oldStatus} a ${newStatus}`,
      professor: {
        id: professor.id_usuario,
        name: professor.nombre,
        oldStatus: oldStatus,
        newStatus: newStatus
      }
    });
  } catch (error) {
    console.error('Error toggling professor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection and server start
const startServer = async () => {
  let dbConnected = false;
  
  // Intentar conectar a la base de datos
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database (only in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false }); // No alterar tablas existentes
      console.log('✅ Database synced successfully.');
      
      // Inicialización de datos COMPLETAMENTE DESHABILITADA
      console.log('📊 Inicialización de datos DESHABILITADA - No se crearán más proyectos de ejemplo');
    }
    dbConnected = true;
  } catch (error) {
    console.warn('⚠️ Database connection failed:', error.message);
    console.warn('⚠️ Server will run without database functionality');
    dbConnected = false;
  }

  // Iniciar servidor independientemente de la base de datos
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📖 Environment: ${process.env.NODE_ENV}`);
    console.log(`💾 Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
    console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`);
  });
};

// Endpoint temporal para actualizar proyectos con el nuevo profesor
app.post('/api/debug/update-projects-professor', async (req, res) => {
  try {
    const { Project } = await import('./models/index.js');
    
    // Actualizar los proyectos que no tienen profesor_id o tienen uno incorrecto
    const [updatedCount] = await Project.update(
      { profesor_id: 189 }, // ID del profesor Manuel Alejandro
      { 
        where: { 
          profesor_id: [1, 2] // Actualizar proyectos con Ana Torres (ID 1) o otros
        } 
      }
    );
    
    res.json({
      success: true,
      updated_projects: updatedCount,
      message: `${updatedCount} proyectos actualizados con Manuel Alejandro como profesor`
    });
  } catch (error) {
    console.error('Error updating projects:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint para verificar usuario actual
app.get('/api/debug/current-user', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol,
        matricula: req.user.matricula
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

startServer();