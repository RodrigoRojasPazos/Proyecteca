import { User } from '../models/index.js';
import { Op } from 'sequelize';

// Obtener todos los usuarios con filtros y paginación
export const getUsers = async (req, res) => {
  try {
    const { 
      search = '', 
      rol = '', 
      limit = 10, 
      page = 1 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Filtro por rol
    if (rol && rol !== 'todos') {
      where.rol = rol;
    }

    // Filtro por búsqueda (correo o nombre)
    if (search) {
      where[Op.or] = [
        { correo: { [Op.like]: `%${search}%` } },
        { nombre: { [Op.like]: `%${search}%` } },
        { matricula: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol', 'avatar', 'creado_en'],
      order: [['creado_en', 'DESC']]
    });

    console.log(`Found ${users.count} users in database`);

    res.json({
      success: true,
      users: users.rows,
      data: users.rows, // Para compatibilidad
      pagination: {
        totalPages: Math.ceil(users.count / limit),
        currentPage: parseInt(page),
        total: users.count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message 
    });
  }
};

// Obtener un usuario por ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol', 'avatar', 'creado_en']
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener usuario',
      error: error.message 
    });
  }
};

// Crear un nuevo usuario
export const createUser = async (req, res) => {
  try {
    const { nombre, correo, matricula, rol } = req.body;

    // Validar campos requeridos
    if (!nombre || !correo || !rol) {
      return res.status(400).json({ 
        success: false,
        message: 'Nombre, correo y rol son requeridos' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { correo } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Ya existe un usuario con este correo' 
      });
    }

    const user = await User.create({
      nombre,
      correo,
      matricula,
      rol
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        matricula: user.matricula,
        rol: user.rol,
        creado_en: user.creado_en
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear usuario',
      error: error.message 
    });
  }
};

// Actualizar un usuario
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, matricula, rol } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    // Verificar si el correo ya existe en otro usuario
    if (correo && correo !== user.correo) {
      const existingUser = await User.findOne({ 
        where: { 
          correo,
          id_usuario: { [Op.ne]: id }
        } 
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: 'Ya existe otro usuario con este correo' 
        });
      }
    }

    // Preparar datos para actualizar
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (correo) updateData.correo = correo;
    if (matricula !== undefined) updateData.matricula = matricula;
    if (rol) updateData.rol = rol;

    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol', 'avatar', 'creado_en']
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message 
    });
  }
};

// Cambiar rol de usuario
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    // Validar rol
    const validRoles = ['alumno', 'profesor', 'director', 'asesor'];
    if (!validRoles.includes(rol)) {
      return res.status(400).json({ 
        success: false,
        message: 'Rol inválido. Los roles válidos son: ' + validRoles.join(', ')
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    await user.update({ rol });

    const updatedUser = await User.findByPk(id, {
      attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol', 'avatar', 'creado_en']
    });

    res.json({
      success: true,
      message: `Rol actualizado a ${rol} exitosamente`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar rol de usuario',
      error: error.message 
    });
  }
};

// Eliminar un usuario
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message 
    });
  }
};

// Obtener estadísticas de usuarios
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const alumnos = await User.count({ where: { rol: 'alumno' } });
    const profesores = await User.count({ where: { rol: 'profesor' } });
    const directores = await User.count({ where: { rol: 'director' } });
    const asesores = await User.count({ where: { rol: 'asesor' } });

    res.json({
      success: true,
      data: {
        total: totalUsers,
        alumnos,
        profesores,
        directores,
        asesores
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener estadísticas de usuarios',
      error: error.message 
    });
  }
};

