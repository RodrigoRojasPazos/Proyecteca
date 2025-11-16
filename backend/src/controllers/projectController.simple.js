import { Project } from '../models/index.js';

export const getProjectsSimple = async (req, res) => {
  try {
    console.log('=== SIMPLE GET PROJECTS ===');
    
    // Consulta muy básica sin includes
    const projects = await Project.findAll({
      limit: 50,
      order: [['creado_en', 'DESC']]
    });

    console.log(`Found ${projects.length} projects`);
    
    // Mapear a formato simple
    const projectsData = projects.map(project => {
      const data = project.toJSON();
      return {
        ...data,
        estado: 'pendiente',
        autor: 'Sin autor',
        asesor: 'Sin asesor',
        programa: data.programa || 'Sin especificar',
        tecnologias: data.tecnologias || [],
        baseDatos: data.base_datos || [],
        alumnos: [],
        profesor: null
      };
    });

    res.json({
      success: true,
      projects: projectsData,
      data: projectsData,
      total: projects.length
    });

  } catch (error) {
    console.error('Simple get projects error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener proyectos (simple)',
      error: error.message 
    });
  }
};