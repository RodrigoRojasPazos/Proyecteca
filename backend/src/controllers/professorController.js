import { User } from '../models/index.js';
import { Op } from 'sequelize';

// Obtener todos los profesores y asesores
export const getProfessors = async (req, res) => {
  try {
    const professors = await User.findAll({
      where: {
        rol: {
          [Op.in]: ['profesor', 'asesor']
        }
      },
      attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol', 'isActive', 'creado_en'],
      order: [['nombre', 'ASC']]
    });

    // Mapear los datos para que el frontend use 'id' e 'email'
    const mappedProfessors = professors.map(prof => ({
      id: prof.id_usuario,
      nombre: prof.nombre,
      email: prof.correo,
      matricula: prof.matricula,
      rol: prof.rol,
      isActive: prof.isActive,
      createdAt: prof.creado_en
    }));

    res.json({
      success: true,
      data: mappedProfessors
    });
  } catch (error) {
    console.error('Error fetching professors:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener profesores',
      error: error.message
    });
  }
};

// Obtener profesores y asesores activos (para el selector)
export const getActiveProfessors = async (req, res) => {
  try {
    const professors = await User.findAll({
      where: {
        rol: {
          [Op.in]: ['profesor', 'asesor']
        },
        isActive: true
      },
      attributes: ['id_usuario', 'nombre', 'correo', 'matricula'],
      order: [['nombre', 'ASC']]
    });

    // Mapear los datos para que el frontend use 'id' e 'email'
    const mappedProfessors = professors.map(prof => ({
      id: prof.id_usuario,
      nombre: prof.nombre,
      email: prof.correo,
      matricula: prof.matricula
    }));

    res.json({
      success: true,
      data: mappedProfessors
    });
  } catch (error) {
    console.error('Error fetching active professors:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener profesores activos',
      error: error.message
    });
  }
};

// Crear un nuevo profesor
export const createProfessor = async (req, res) => {
  try {
    const { nombre, email, matricula } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !matricula) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y matrícula son requeridos'
      });
    }

    // Verificar que no exista otro usuario con el mismo email o matrícula
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { correo: email },
          { matricula: matricula }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.correo === email 
          ? 'Ya existe un usuario con ese email' 
          : 'Ya existe un usuario con esa matrícula'
      });
    }

    // Crear el profesor
    const professor = await User.create({
      nombre,
      correo: email,
      matricula,
      rol: 'profesor',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Profesor creado exitosamente',
      data: {
        id: professor.id_usuario,
        nombre: professor.nombre,
        email: professor.correo,
        matricula: professor.matricula,
        isActive: professor.isActive
      }
    });
  } catch (error) {
    console.error('Error creating professor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear profesor',
      error: error.message
    });
  }
};

// Actualizar un profesor
export const updateProfessor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, matricula, isActive } = req.body;

    const professor = await User.findOne({
      where: { 
        id_usuario: id, 
        rol: {
          [Op.in]: ['profesor', 'asesor']
        }
      }
    });

    if (!professor) {
      return res.status(404).json({
        success: false,
        message: 'Profesor no encontrado'
      });
    }

    // Verificar duplicados si se está cambiando email o matrícula
    if (email !== professor.correo || matricula !== professor.matricula) {
      const existingUser = await User.findOne({
        where: {
          id_usuario: { [Op.ne]: id },
          [Op.or]: [
            { correo: email },
            { matricula: matricula }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.correo === email 
            ? 'Ya existe un usuario con ese email' 
            : 'Ya existe un usuario con esa matrícula'
        });
      }
    }

    // Actualizar
    await professor.update({
      nombre: nombre || professor.nombre,
      correo: email || professor.correo,
      matricula: matricula || professor.matricula,
      isActive: isActive !== undefined ? isActive : professor.isActive
    });

    res.json({
      success: true,
      message: 'Profesor actualizado exitosamente',
      data: {
        id: professor.id_usuario,
        nombre: professor.nombre,
        email: professor.correo,
        matricula: professor.matricula,
        isActive: professor.isActive
      }
    });
  } catch (error) {
    console.error('Error updating professor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar profesor',
      error: error.message
    });
  }
};

// Desactivar/Activar un profesor (no eliminar por integridad de proyectos)
export const toggleProfessorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    //console.log(`Toggling status for professor ID: ${id}`);

    const professor = await User.findOne({
      where: { 
        id_usuario: id, 
        rol: {
          [Op.in]: ['profesor', 'asesor']
        }
      }
    });

    if (!professor) {
      //console.log(`Professor with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Profesor no encontrado'
      });
    }

    const oldStatus = professor.isActive;
    const newStatus = !professor.isActive;
   // console.log(`Changing professor ${professor.nombre} status from ${oldStatus} to ${newStatus}`);
    
    await professor.update({
      isActive: newStatus
    });

    // Refrescar el objeto para obtener los datos actualizados
    await professor.reload();
   // console.log(`Professor ${professor.nombre} status updated to: ${professor.isActive}`);

    // Verificar directamente en la base de datos
    const verification = await User.findByPk(professor.id_usuario);
   // console.log(`Database verification - Professor ${verification.nombre} isActive: ${verification.isActive}`);

    res.json({
      success: true,
      message: `Profesor ${professor.isActive ? 'activado' : 'desactivado'} exitosamente`,
      data: {
        id: professor.id_usuario,
        nombre: professor.nombre,
        isActive: professor.isActive
      }
    });
  } catch (error) {
    //console.error('Error toggling professor status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del profesor',
      error: error.message
    });
  }
};