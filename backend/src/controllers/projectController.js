import { Project, User, Cuatrimestre, ProyectoAlumno, Archivo } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getProjects = async (req, res) => {
  try {
    console.log('=== GET PROJECTS REQUEST ===');
    console.log('User:', req.user?.correo);
    console.log('Query params:', req.query);
    
    const { page = 1, limit = 10, estatus, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    // Filtrar por rol de usuario
    if (req.user.rol === 'estudiante') {
      console.log('Filtering for student role');
    }

    if (estatus) {
      where.estatus = estatus;
      console.log('Filtering by estatus:', estatus);
    }

    if (search) {
      where[Op.or] = [
        { titulo: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } },
        { asignatura: { [Op.like]: `%${search}%` } }
      ];
      console.log('Filtering by search:', search);
    }

    console.log('Where clause:', where);

    // Agregando todas las relaciones principales
    console.log('Fetching projects with all main relations...');
    
    const projects = await Project.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'profesor',
          attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol'],
          required: false
        },
        {
          model: User,
          as: 'alumnos',
          attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol', 'creado_en'],
          through: { attributes: [] },
          required: false
        },
        {
          model: Cuatrimestre,
          as: 'cuatrimestre',
          attributes: ['id_cuatri', 'nombre', 'fecha_inicio', 'fecha_fin', 'estatus'],
          required: false
        }
      ],
      order: [['creado_en', 'DESC']]
    });

    console.log(`Found ${projects.count} projects in database`);
    
    // Debug: mostrar información del primer proyecto
    if (projects.rows.length > 0) {
      const firstProject = projects.rows[0].toJSON();
      console.log('=== SAMPLE PROJECT DATA FROM DB ===');
      console.log('ID:', firstProject.id_proyecto);
      console.log('Título:', firstProject.titulo);
      console.log('PROGRAMA:', firstProject.programa);
      console.log('Autor:', firstProject.autor);
      console.log('Asesor:', firstProject.asesor);
      console.log('Asignatura:', firstProject.asignatura);
      console.log('Estado:', firstProject.estado);
      console.log('Tecnologias raw:', firstProject.tecnologias);
      console.log('Base_datos raw:', firstProject.base_datos);
      console.log('Alumnos_data:', firstProject.alumnos_data);
      console.log('=====================================');
    }
    
    // Mapear estatus del backend al estado del frontend (versión simple)
    const projectsWithEstado = projects.rows.map(project => {
      const projectData = project.toJSON();
      
      // Mapear estatus a estado para compatibilidad con el frontend
      switch (projectData.estatus) {
        case 'borrador':
          projectData.estado = 'pendiente';
          break;
        case 'en_revision':
          projectData.estado = 'en-revision';
          break;
        case 'aprobado':
          projectData.estado = 'aceptado';
          break;
        case 'rechazado':
          projectData.estado = 'rechazado';
          break;
        default:
          projectData.estado = 'pendiente';
      }

      // Datos completos con todas las relaciones principales
      return {
        ...projectData,
        autor: projectData.alumnos && projectData.alumnos.length > 0 
          ? projectData.alumnos[0].nombre 
          : 'Sin autor especificado',
        asesor: projectData.profesor ? projectData.profesor.nombre : 'Sin asesor asignado',
        programa: projectData.programa || 'Sin especificar', // Usar el campo programa correcto
        fechaDefensa: projectData.fecha_defensa || projectData.fechaDefensa || 'Sin fecha definida',
        url_repositorio: projectData.url_repositorio || '',
        tecnologias: (() => {
          if (Array.isArray(projectData.tecnologias)) {
            return projectData.tecnologias;
          }
          if (typeof projectData.tecnologias === 'string') {
            // Si es JSON válido, parsearlo
            if (projectData.tecnologias.trim().startsWith('[') || projectData.tecnologias.trim().startsWith('{')) {
              try {
                return JSON.parse(projectData.tecnologias);
              } catch {
                return [projectData.tecnologias]; // Si falla el parse, tratar como string simple
              }
            }
            // Si es string simple, convertir a array
            return projectData.tecnologias ? [projectData.tecnologias] : [];
          }
          return [];
        })(),
        baseDatos: (() => {
          if (Array.isArray(projectData.base_datos)) {
            return projectData.base_datos;
          }
          if (typeof projectData.base_datos === 'string') {
            // Si es JSON válido, parsearlo
            if (projectData.base_datos.trim().startsWith('[') || projectData.base_datos.trim().startsWith('{')) {
              try {
                return JSON.parse(projectData.base_datos);
              } catch {
                return [projectData.base_datos]; // Si falla el parse, tratar como string simple
              }
            }
            // Si es string simple, convertir a array
            return projectData.base_datos ? [projectData.base_datos] : [];
          }
          return [];
        })(),
        alumnos: projectData.alumnos || [],
        profesor: projectData.profesor,
        cuatrimestreInfo: projectData.cuatrimestre,
        archivo: projectData.archivo || null
      };
    });

    console.log('Projects with estado mapping:', JSON.stringify(projectsWithEstado, null, 2));

    res.json({
      success: true,
      projects: projectsWithEstado,
      data: projectsWithEstado, // Para compatibilidad
      pagination: {
        totalPages: Math.ceil(projects.count / limit),
        currentPage: parseInt(page),
        total: projects.count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('=== GET PROJECTS ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('SQL Error:', error.sql);
    console.error('================================');
    
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener proyectos',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        sql: error.sql
      } : undefined
    });
  }
};

export const createProject = async (req, res) => {
  try {
    console.log('===== CREATE PROJECT REQUEST =====');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    console.log('PROGRAMA RECIBIDO EN BACKEND:', req.body.programa);
    console.log('Archivo subido:', req.file);
    console.log('==========================================');
    
    const { 
      titulo, 
      descripcion, 
      autor,
      asesor,
      programa,
      fechaDefensa,
      url_repositorio,
      baseDatos,
      tecnologias,
      asignatura,
      tipo,
      periodo,
      cuatrimestre_id,
      profesor_id,
      alumnos
    } = req.body;

    // Procesar campos JSON que pueden venir como strings
    let tecnologiasParsed = tecnologias;
    let baseDatosParsed = baseDatos;
    let alumnosParsed = alumnos;

    // Procesar tecnologias - puede ser string JSON o string simple
    try {
      if (typeof tecnologias === 'string') {
        // Intentar parsear como JSON primero
        try {
          tecnologiasParsed = JSON.parse(tecnologias);
        } catch {
          // Si falla, tratarlo como string simple y convertir a array
          tecnologiasParsed = [tecnologias];
        }
      } else if (Array.isArray(tecnologias)) {
        tecnologiasParsed = tecnologias;
      }
    } catch (e) {
      console.log('Error parsing tecnologias:', e);
      tecnologiasParsed = [];
    }

    // Procesar baseDatos - puede ser string JSON o string simple
    try {
      if (typeof baseDatos === 'string') {
        // Intentar parsear como JSON primero
        try {
          baseDatosParsed = JSON.parse(baseDatos);
        } catch {
          // Si falla, tratarlo como string simple y convertir a array
          baseDatosParsed = [baseDatos];
        }
      } else if (Array.isArray(baseDatos)) {
        baseDatosParsed = baseDatos;
      }
    } catch (e) {
      console.log('Error parsing baseDatos:', e);
      baseDatosParsed = [];
    }

    try {
      if (typeof alumnos === 'string') {
        alumnosParsed = JSON.parse(alumnos);
      }
    } catch (e) {
      console.log('Error parsing alumnos:', e);
      alumnosParsed = null;
    }

    console.log('Processed data:');
    console.log('- tecnologiasParsed:', tecnologiasParsed);
    console.log('- baseDatosParsed:', baseDatosParsed);
    console.log('- alumnosParsed:', alumnosParsed);

    // Validar campos requeridos
    if (!titulo) {
      return res.status(400).json({ 
        success: false,
        message: 'El título es requerido' 
      });
    }

    // Crear el proyecto
    const project = await Project.create({
      titulo,
      descripcion,
      asignatura: asignatura || tipo,
      cuatrimestre_id: cuatrimestre_id || 8,
      tipo: tipo === 'estadía' ? 'estadía' : 'estancia',
      origen: 'inicial',
      periodo: periodo || new Date().getFullYear().toString(),
      url_repositorio,
      tecnologias: tecnologiasParsed || [],
      base_datos: baseDatosParsed || [],
      estatus: 'borrador',
      profesor_id: profesor_id || req.user?.id_usuario || 1,
      // Nuevos campos agregados
      programa: programa || 'Sin especificar',
      autor: autor || req.user?.nombre || 'Sin autor',
      asesor: asesor || 'Sin asesor',
      fecha_defensa: fechaDefensa || null,
      archivo: req.file ? req.file.filename : null, // Guardar nombre del archivo subido
      alumnos_data: alumnosParsed || null,
      estado: 'pendiente'
    });

    // Si hay alumnos en el cuerpo de la petición, crear las relaciones
    if (alumnosParsed && Array.isArray(alumnosParsed) && alumnosParsed.length > 0) {
      try {
        // Crear los usuarios alumnos si no existen
        for (const alumno of alumnosParsed) {
          const [usuario] = await User.findOrCreate({
            where: { correo: alumno.email },
            defaults: {
              nombre: alumno.nombre,
              correo: alumno.email,
              rol: 'alumno',
              matricula: alumno.matricula
            }
          });
          
          // Crear la relación proyecto-alumno
          await project.addAlumno(usuario);
        }
      } catch (relationError) {
        console.error('Error creating student relations:', relationError);
        // No fallar completamente si hay error en las relaciones
      }
    }

    // Incluir información completa del proyecto creado
    const projectWithDetails = await Project.findByPk(project.id_proyecto, {
      include: [
        {
          model: User,
          as: 'profesor',
          attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol']
        },
        {
          model: Cuatrimestre,
          as: 'cuatrimestre',
          attributes: ['id_cuatri', 'nombre', 'fecha_inicio', 'fecha_fin', 'estatus']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: projectWithDetails
    });
  } catch (error) {
    console.error('===== CREATE PROJECT ERROR =====');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error sql:', error.sql);
    console.error('====================================');
    res.status(500).json({ 
      success: false,
      message: 'Error al crear el proyecto',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      titulo, 
      descripcion, 
      url_repositorio, 
      estatus, 
      estado, 
      motivo_rechazo, 
      comentarios,
      autor,
      programa,
      fechaDefensa,
      asesor,
      tecnologias,
      baseDatos,
      asignatura,
      tipo,
      profesor_id,
      alumnos
    } = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Proyecto no encontrado' 
      });
    }

    // Si se subió un nuevo archivo, eliminar el archivo anterior
    if (req.file && project.archivo) {
      try {
        const uploadsDir = path.join(__dirname, '../../uploads');
        const oldFilePath = path.join(uploadsDir, project.archivo);
        
        // Verificar si el archivo anterior existe antes de eliminarlo
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log('Archivo anterior eliminado:', project.archivo);
        }
      } catch (fileError) {
        console.error('Error al eliminar archivo anterior:', fileError);
        // No fallar la actualización si hay error al eliminar el archivo
      }
    }

    // Procesar campos JSON que pueden venir como strings
    let tecnologiasParsed = tecnologias;
    let baseDatosParsed = baseDatos;
    let alumnosParsed = alumnos;

    // Procesar tecnologias
    try {
      if (typeof tecnologias === 'string') {
        try {
          tecnologiasParsed = JSON.parse(tecnologias);
        } catch {
          tecnologiasParsed = [tecnologias];
        }
      } else if (Array.isArray(tecnologias)) {
        tecnologiasParsed = tecnologias;
      }
    } catch (e) {
      console.log('Error parsing tecnologias:', e);
    }

    // Procesar baseDatos
    try {
      if (typeof baseDatos === 'string') {
        try {
          baseDatosParsed = JSON.parse(baseDatos);
        } catch {
          baseDatosParsed = [baseDatos];
        }
      } else if (Array.isArray(baseDatos)) {
        baseDatosParsed = baseDatos;
      }
    } catch (e) {
      console.log('Error parsing baseDatos:', e);
    }

    // Procesar alumnos
    try {
      if (typeof alumnos === 'string') {
        alumnosParsed = JSON.parse(alumnos);
      }
    } catch (e) {
      console.log('Error parsing alumnos:', e);
    }

    // Mapear estados del frontend al backend
    let estatusActualizado = estatus;
    if (estado) {
      switch (estado) {
        case 'pendiente':
          estatusActualizado = 'borrador';
          break;
        case 'en-revision':
          estatusActualizado = 'en_revision';
          break;
        case 'aceptado':
          estatusActualizado = 'aprobado';
          break;
        case 'rechazado':
          estatusActualizado = 'rechazado';
          break;
      }
    }

    // Preparar datos para actualizar
    const updateData = {};
    if (titulo) updateData.titulo = titulo;
    if (descripcion) updateData.descripcion = descripcion;
    if (url_repositorio) updateData.url_repositorio = url_repositorio;
    if (estatusActualizado) updateData.estatus = estatusActualizado;
    if (motivo_rechazo) updateData.motivo_rechazo = motivo_rechazo;
    if (comentarios) updateData.comentarios = comentarios;
    if (autor) updateData.autor = autor;
    if (programa) updateData.programa = programa;
    if (fechaDefensa) updateData.fecha_defensa = fechaDefensa;
    if (asesor) updateData.asesor = asesor;
    if (asignatura) updateData.asignatura = asignatura;
    if (tipo) updateData.tipo = tipo;
    if (profesor_id) updateData.profesor_id = profesor_id;
    if (tecnologiasParsed) updateData.tecnologias = tecnologiasParsed;
    if (baseDatosParsed) updateData.base_datos = baseDatosParsed;
    if (alumnosParsed) updateData.alumnos_data = alumnosParsed;
    
    // Actualizar el archivo si se subió uno nuevo
    if (req.file) {
      updateData.archivo = req.file.filename;
    }
    
    // Actualizar campo estado directamente si se proporciona
    if (estado) updateData.estado = estado;

    await project.update(updateData);

    // Si hay alumnos en el cuerpo de la petición, actualizar las relaciones
    if (alumnosParsed && Array.isArray(alumnosParsed) && alumnosParsed.length > 0) {
      try {
        // Eliminar relaciones existentes
        await project.setAlumnos([]);
        
        // Crear/actualizar los usuarios alumnos y establecer nuevas relaciones
        for (const alumno of alumnosParsed) {
          const [usuario] = await User.findOrCreate({
            where: { correo: alumno.email },
            defaults: {
              nombre: alumno.nombre,
              correo: alumno.email,
              rol: 'alumno',
              matricula: alumno.matricula
            }
          });
          
          // Crear la relación proyecto-alumno
          await project.addAlumno(usuario);
        }
      } catch (relationError) {
        console.error('Error updating student relations:', relationError);
        // No fallar completamente si hay error en las relaciones
      }
    }

    const updatedProject = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'profesor',
          attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol']
        },
        {
          model: Cuatrimestre,
          as: 'cuatrimestre',
          attributes: ['id_cuatri', 'nombre', 'fecha_inicio', 'fecha_fin', 'estatus']
        }
      ]
    });

    // Mapear estatus del backend al estado del frontend
    const projectData = updatedProject.toJSON();
    switch (projectData.estatus) {
      case 'borrador':
        projectData.estado = 'pendiente';
        break;
      case 'en_revision':
        projectData.estado = 'en-revision';
        break;
      case 'aprobado':
        projectData.estado = 'aceptado';
        break;
      case 'rechazado':
        projectData.estado = 'rechazado';
        break;
      default:
        projectData.estado = 'pendiente';
    }

    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: projectData
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar el proyecto',
      error: error.message 
    });
  }
};

// Obtener estadísticas de proyectos
export const getProjectStats = async (req, res) => {
  try {
    const totalProjects = await Project.count();
    const activeProjects = await Project.count({
      where: {
        estatus: ['en_revision', 'aprobado']
      }
    });
    const completedProjects = await Project.count({
      where: {
        estatus: 'aprobado'
      }
    });
    const draftProjects = await Project.count({
      where: {
        estatus: 'borrador'
      }
    });
    const rejectedProjects = await Project.count({
      where: {
        estatus: 'rechazado'
      }
    });

    res.json({
      success: true,
      data: {
        total_proyectos: totalProjects,
        proyectos_activos: activeProjects,
        proyectos_completados: completedProjects,
        proyectos_borradores: draftProjects,
        proyectos_rechazados: rejectedProjects
      }
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener estadísticas de proyectos',
      error: error.message 
    });
  }
};

// Obtener un proyecto específico con todos sus detalles
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'profesor',
          attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol'],
          required: false
        },
        {
          model: Cuatrimestre,
          as: 'cuatrimestre',
          attributes: ['id_cuatri', 'nombre', 'fecha_inicio', 'fecha_fin', 'estatus'],
          required: false
        },
        {
          model: User,
          as: 'alumnos',
          attributes: ['id_usuario', 'nombre', 'correo', 'matricula', 'rol', 'creado_en'],
          through: { attributes: [] },
          required: false
        },
        {
          model: Archivo,  
          as: 'archivos',
          attributes: ['id_archivo', 'ruta_archivo', 'tipo', 'subido_en'],
          required: false
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Proyecto no encontrado' 
      });
    }

    const projectData = project.toJSON();
    
    // Mapear estatus a estado para compatibilidad con frontend
    switch (projectData.estatus) {
      case 'borrador':
        projectData.estado = 'pendiente';
        break;
      case 'en_revision':
        projectData.estado = 'en-revision';
        break;
      case 'aprobado':
        projectData.estado = 'aceptado';
        break;
      case 'rechazado':
        projectData.estado = 'rechazado';
        break;
      default:
        projectData.estado = 'pendiente';
    }

    // Normalizar campos
    const normalizedProject = {
      ...projectData,
      titulo: projectData.titulo || 'Sin título',
      descripcion: projectData.descripcion || 'Sin descripción',
      autor: projectData.alumnos && projectData.alumnos.length > 0 
        ? projectData.alumnos[0].nombre 
        : 'Sin autor especificado',
      asesor: projectData.profesor ? projectData.profesor.nombre : 'Sin asesor asignado',
      programa: projectData.programa || 'Sin especificar',
      fechaDefensa: projectData.fecha_defensa || projectData.fechaDefensa || 'Sin fecha definida',
      url_repositorio: projectData.url_repositorio || '',
      tecnologias: Array.isArray(projectData.tecnologias) ? projectData.tecnologias : 
                  typeof projectData.tecnologias === 'string' ? projectData.tecnologias.split(',').map(t => t.trim()) : [],
      baseDatos: Array.isArray(projectData.base_datos) ? projectData.base_datos :
                Array.isArray(projectData.baseDatos) ? projectData.baseDatos :
                typeof projectData.base_datos === 'string' ? projectData.base_datos.split(',').map(db => db.trim()) : []
    };

    res.json({
      success: true,
      data: normalizedProject
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el proyecto',
      error: error.message 
    });
  }
};

export const deleteProject = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    console.log(`=== DELETE PROJECT ${id} ===`);
    console.log('Usuario que intenta eliminar:', req.user.correo, 'Rol:', req.user.rol);
    console.log('Objeto user completo:', req.user);

    const project = await Project.findByPk(id);

    if (!project) {
      await transaction.rollback();
      console.log('❌ Proyecto no encontrado en la base de datos');
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log('✅ Proyecto encontrado:', project.titulo, 'ID:', project.id_proyecto);

    // Verificar permisos más flexibles
    // Permitir eliminación si:
    // 1. Es director o admin
    // 2. Es el profesor asesor asignado al proyecto
    // 3. Es el autor del proyecto (verificar en la tabla proyectos_alumnos)
    console.log('Verificando permisos...');
    
    const userRole = req.user.rol;
    const userEmail = req.user.correo;
    const userId = req.user.id_usuario;
    
    if (!['director', 'admin'].includes(userRole)) {
      console.log('Usuario no es director/admin, verificando otros permisos...');
      
      let hasPermission = false;
      
      // Verificar si es profesor asesor del proyecto
      if (userRole === 'profesor' && project.profesor_id === userId) {
        console.log('✅ Usuario es el profesor asesor del proyecto');
        hasPermission = true;
      }
      
      // Verificar si el usuario es autor del proyecto
      if (!hasPermission) {
        console.log('Parámetros de consulta - ID proyecto:', id, 'Email usuario:', userEmail);
        
        const isAuthor = await sequelize.query(
          'SELECT COUNT(*) as count FROM proyectos_alumnos pa JOIN usuarios u ON pa.id_alumno = u.id_usuario WHERE pa.id_proyecto = :projectId AND u.correo = :userEmail',
          {
            replacements: { projectId: id, userEmail: userEmail },
            type: sequelize.QueryTypes.SELECT,
            transaction
          }
        );
        
        console.log('Resultado verificación de autoría:', isAuthor);
        
        if (isAuthor[0] && isAuthor[0].count > 0) {
          console.log('✅ Usuario verificado como autor del proyecto');
          hasPermission = true;
        }
      }
      
      if (!hasPermission) {
        console.log('❌ Usuario no tiene permisos para eliminar este proyecto');
        await transaction.rollback();
        return res.status(403).json({ message: 'No tienes permisos para eliminar este proyecto' });
      }
    } else {
      console.log('✅ Usuario es director/admin, permitiendo eliminación');
    }

    // Eliminar registros relacionados primero para evitar restricciones de clave foránea
    console.log('🗑️ Eliminando relaciones en proyectos_alumnos...');
    
    // 1. Eliminar relaciones en proyectos_alumnos si existe
    const deletedRelations = await sequelize.query(
      'DELETE FROM proyectos_alumnos WHERE id_proyecto = ?',
      {
        replacements: [id],
        transaction
      }
    );

    console.log('🗑️ Relaciones eliminadas:', deletedRelations);

    // 2. Eliminar otras relaciones si existen (comentarios, revisiones, etc.)
    // Puedes agregar más eliminaciones aquí si hay otras tablas relacionadas
    
    // 3. Finalmente eliminar el proyecto
    console.log('🗑️ Eliminando proyecto de la tabla proyectos...');
    const deletedProject = await project.destroy({ transaction });
    console.log('✅ Proyecto eliminado:', deletedProject);

    await transaction.commit();
    console.log('✅ Transacción commitada exitosamente');
    res.json({ message: 'Project deleted successfully' });
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Delete project error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    // Mensaje más específico si es error de clave foránea
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ 
        message: 'No se puede eliminar el proyecto porque tiene registros relacionados',
        error: 'Foreign key constraint' 
      });
    } else {
      res.status(500).json({ message: 'Error deleting project', details: error.message });
    }
  }
};

// Función para extraer matrícula del email
const extraerMatriculaDeEmail = (email) => {
  if (!email) return 'sin-email';
  const match = email.match(/^(\d+)@/);
  return match ? match[1] : email.split('@')[0];
};

// Endpoint para servir archivos de proyectos
export const getProjectFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar el proyecto con información de alumnos
    const project = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'alumnos',
          attributes: ['id_usuario', 'correo', 'nombre'],
          through: { attributes: [] },
          required: false
        }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Proyecto no encontrado' 
      });
    }
    
    if (!project.archivo) {
      return res.status(404).json({ 
        success: false,
        message: 'No hay archivo asociado a este proyecto' 
      });
    }
    
    // Determinar la carpeta del archivo basada en el alumno
    let userEmail = 'unknown';
    
    // Intentar obtener email de alumnos_data primero
    if (project.alumnos_data) {
      try {
        const alumnosData = typeof project.alumnos_data === 'string' 
          ? JSON.parse(project.alumnos_data) 
          : project.alumnos_data;
        if (Array.isArray(alumnosData) && alumnosData.length > 0) {
          userEmail = alumnosData[0].email || alumnosData[0].correo || userEmail;
        }
      } catch (e) {
        console.log('Error parsing alumnos_data:', e);
      }
    }
    
    // Si no encontró email en alumnos_data, usar la relación
    if (userEmail === 'unknown' && project.alumnos && project.alumnos.length > 0) {
      userEmail = project.alumnos[0].correo || userEmail;
    }
    
    const matricula = extraerMatriculaDeEmail(userEmail);
    const filePath = path.join(__dirname, '../../uploads', matricula, project.archivo);
    
    console.log('Trying to serve file:', filePath);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false,
        message: 'Archivo no encontrado en el servidor',
        debug: {
          expectedPath: filePath,
          filename: project.archivo,
          matricula: matricula,
          email: userEmail
        }
      });
    }
    
    // Servir el archivo
    res.sendFile(filePath, {
      headers: {
        'Content-Disposition': `inline; filename="${project.archivo}"`
      }
    });
    
  } catch (error) {
    console.error('Get project file error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el archivo del proyecto' 
    });
  }
};

