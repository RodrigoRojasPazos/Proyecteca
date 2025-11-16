import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, AccessException } from '../models/index.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Utilidad: valida dominio y año de matrícula (si rol === 'alumno') con regla fija 2020; permite excepción manual por email
const validateInstitutionalEmail = async (email, role = 'alumno') => {
  const result = { allowed: true, reasons: [] };
  const allowedDomains = ['upqroo.edu.mx', 'estudiantes.upqroo.edu.mx'];
  const emailLower = (email || '').toLowerCase();
  const [localPart, domainPart] = emailLower.split('@');

  if (!allowedDomains.includes(domainPart)) {
    result.allowed = false;
    result.reasons.push('Dominio no permitido: usa tu correo @upqroo.edu.mx o @estudiantes.upqroo.edu.mx');
  }

  if (role === 'alumno') {
    const match = localPart && localPart.match(/^(\d{4})/);
    const year = match ? parseInt(match[1], 10) : NaN;
    const minYear = 2020; // Regla fija no editable
    const passByYear = !!(match && year && (year >= minYear));

    // Excepción manual por email
    if (!passByYear) {
      try {
        const exception = await AccessException.findOne({ where: { email: emailLower } });
        if (exception) {
          result.allowed = true; // Forzar permitido
          result.reasons.push('Acceso permitido por excepción manual');
          return result;
        }
      } catch (e) {
        // Ignorar errores de consulta
      }
    }
    if (!passByYear) {
      result.allowed = false;
      result.reasons.push(`Matrícula inválida: solo alumnos con año de ingreso >= ${minYear}`);
    }
  }

  return result;
};

export const googleLogin = async (req, res) => {
  try {
    console.log('Solicitud de login con Google recibida');
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ message: 'No se proporcionó credencial de Google' });
    }

    // Verificar token con Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    console.log('Token verificado, email:', email);

    // Buscar usuario existente primero
    let user = await User.findOne({ where: { correo: email } });

    // Validar dominio primero
    const domain = (email || '').toLowerCase().split('@')[1];
    const allowedDomains = ['upqroo.edu.mx', 'estudiantes.upqroo.edu.mx'];
    if (!allowedDomains.includes(domain)) {
      return res.status(403).json({ message: 'Acceso restringido', reasons: ['Dominio no permitido: usa tu correo @upqroo.edu.mx o @estudiantes.upqroo.edu.mx'] });
    }

    // Si el usuario no existe, determinar rol basado en formato de correo
    if (!user) {
      const emailLower = email.toLowerCase();
      const localPart = emailLower.split('@')[0];
      const hasMatriculaFormat = /^\d{4}/.test(localPart); // Verifica si empieza con 4 dígitos
      
      let newRole = 'profesor'; // Por defecto profesor si no tiene formato de matrícula
      
      if (hasMatriculaFormat) {
        // Si tiene formato de matrícula, validar año
        const policy = await validateInstitutionalEmail(email, 'alumno');
        if (policy.allowed) {
          newRole = 'alumno';
        } else {
          // No pasa la validación de año, rechazar
          return res.status(403).json({ message: 'Acceso restringido', reasons: policy.reasons });
        }
      }
      
      // Crear nuevo usuario con el rol determinado
      user = await User.create({
        correo: email,
        nombre: name,
        rol: newRole,
        avatar: picture
      });
    } else {
      // Usuario existe: validar según su rol actual
      if (user.rol === 'alumno') {
        const policy = await validateInstitutionalEmail(email, 'alumno');
        if (!policy.allowed) {
          return res.status(403).json({ message: 'Acceso restringido', reasons: policy.reasons });
        }
      }
      // Usuario existe: actualizar info básica
      await user.update({ nombre: name, avatar: picture });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id_usuario, email: user.correo, role: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id_usuario: user.id_usuario,
        email: user.correo,
        nombre: user.nombre,
        rol: user.rol,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Google login error:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(401).json({ 
      message: 'Error al verificar token de Google', 
      error: error.message,
      clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'No configurado'
    });
  }
};

export const verifyToken = async (req, res) => {
  try {
    console.log('Verificación de token solicitada');
    
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Usuario no autenticado',
        error: 'No user found in request'
      });
    }
    
    console.log('Token verificado para usuario:', user.correo);
    
    return res.json({
      id_usuario: user.id_usuario,
      email: user.correo,
      nombre: user.nombre,
      rol: user.rol,
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Error en verificación de token:', error);
    return res.status(401).json({ 
      message: 'Token inválido',
      error: error.message 
    });
  }
};

export const logout = async (req, res) => {
  // En este caso simple, el logout es del lado del cliente
  // pero podrías implementar blacklist de tokens aquí
  res.json({ message: 'Logged out successfully' });
};



// Login directo con email y contraseña
export const directLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // Validar dominio institucional primero
    const domain = (email || '').toLowerCase().split('@')[1];
    const allowedDomains = ['upqroo.edu.mx', 'estudiantes.upqroo.edu.mx'];
    if (!allowedDomains.includes(domain)) {
      return res.status(403).json({ message: 'Acceso restringido', reasons: ['Dominio no permitido: usa tu correo @upqroo.edu.mx o @estudiantes.upqroo.edu.mx'] });
    }

    // Buscar usuario por email
    const user = await User.findOne({ where: { correo: email } });

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // Si no tiene contraseña configurada, usar contraseña por defecto
    if (!user.contraseña) {
      // Para usuarios existentes sin contraseña, usar "123456" como contraseña por defecto
      const defaultPassword = '123456';
      if (password !== defaultPassword) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
      }
    } else {
      // Verificar contraseña hasheada
      const isValidPassword = await bcrypt.compare(password, user.contraseña);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
      }
    }

    // Aplicar política solo para alumnos
    if (user.rol === 'alumno') {
      const policy = await validateInstitutionalEmail(email, 'alumno');
      if (!policy.allowed) {
        return res.status(403).json({ message: 'Acceso restringido', reasons: policy.reasons });
      }
    }
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id_usuario, 
        email: user.correo, 
        role: user.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id_usuario: user.id_usuario,
        email: user.correo,
        nombre: user.nombre,
        rol: user.rol,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Direct login error:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};