import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para extraer matrícula del email
const extraerMatriculaDeEmail = (email) => {
  if (!email) return 'sin-email';
  const match = email.match(/^(\d+)@/);
  return match ? match[1] : email.split('@')[0];
};

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Extraer el email del cuerpo de la petición o del usuario autenticado
      let userEmail = req.body.autorEmail || req.user?.correo || 'unknown';
      
      // Si viene en formato JSON de alumnos, extraerlo
      if (req.body.alumnos) {
        try {
          const alumnos = typeof req.body.alumnos === 'string' 
            ? JSON.parse(req.body.alumnos) 
            : req.body.alumnos;
          if (Array.isArray(alumnos) && alumnos.length > 0) {
            userEmail = alumnos[0].email || alumnos[0].correo || userEmail;
          }
        } catch (e) {
          console.log('Error parsing alumnos for file upload:', e);
        }
      }
      
      const matricula = extraerMatriculaDeEmail(userEmail);
      const uploadDir = path.join(__dirname, '../../uploads', matricula);
      
      // Crear directorio si no existe
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        //console.log(`Created directory: ${uploadDir}`);
      }
      
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(null, path.join(__dirname, '../../uploads')); // Fallback
    }
  },
  filename: (req, file, cb) => {
    try {
      // Obtener información del proyecto para nombre único
      const projectTitle = req.body.titulo || 'proyecto';
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const originalName = file.originalname;
      const ext = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, ext);
      
      // Limpiar título para usar como nombre de archivo
      const cleanTitle = projectTitle
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30);
      
      const filename = `${cleanTitle}-${timestamp}-${nameWithoutExt}${ext}`;
      //console.log(`Saving file as: ${filename}`);
      
      cb(null, filename);
    } catch (error) {
      console.error('Error generating filename:', error);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }
});

// Filtro de archivos - Solo PDFs permitidos
const fileFilter = (req, file, cb) => {
  const allowedExtension = /pdf/;
  const allowedMimeType = /application\/pdf/;
  
  const extname = allowedExtension.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeType.test(file.mimetype);

  if (mimetype && extname) {
    //console.log(` PDF file accepted: ${file.originalname}`);
    return cb(null, true);
  } else {
    //console.log(` File rejected: ${file.originalname} (${file.mimetype})`);
    cb(new Error('Solo se permiten archivos PDF (.pdf)'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB default (aumentado de 50MB)
  },
  fileFilter: fileFilter
});