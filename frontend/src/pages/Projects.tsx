import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Project } from '../types';
import { Edit, Trash2, Calendar, User, BookOpen, Tag, FileText, X, RefreshCw } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import Layout from '../components/Layout';
import { projectsAPI } from '../services/api';
import UploadProject from '../components/UploadProject';

const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Función para determinar si el usuario puede eliminar un proyecto
  const canDeleteProject = (project: Project): boolean => {
    if (!user) return false;
    
    // Director puede eliminar cualquier proyecto
    if (user.rol === 'director') return true;
    
    // Verificar si el usuario es el autor del proyecto (independientemente de su rol)
    const isAuthor = project.alumnos?.some(alumno => alumno.id_usuario === user.id_usuario);
    if (isAuthor) return true;
    
    // Profesor asesor puede eliminar si es el asesor asignado del proyecto
    if (user.rol === 'profesor' && project.profesor_id === user.id_usuario) return true;
    
    return false;
  };

  // Función para determinar si el usuario puede editar un proyecto
  const canEditProject = (project: Project): boolean => {
    if (!user) return false;
    
    // Director puede editar cualquier proyecto
    if (user.rol === 'director') return true;
    
    // Verificar si el usuario es el autor del proyecto (independientemente de su rol)
    const isAuthor = project.alumnos?.some(alumno => alumno.id_usuario === user.id_usuario);
    if (isAuthor) return true;
    
    // Profesor asesor puede editar si es el asesor asignado del proyecto
    if (user.rol === 'profesor' && project.profesor_id === user.id_usuario) return true;
    
    return false;
  };

  // Función para extraer matrícula del campo alumnos_data
  const extraerMatricula = (alumnos: any): string => {
    if (!alumnos) return 'N/A';
    
    try {
      // Si es un array directo
      if (Array.isArray(alumnos)) {
        if (alumnos.length > 0) {
          // Buscar matrícula en el objeto
          if (alumnos[0].matricula) return alumnos[0].matricula;
          
          // Extraer de correo (antes del @)
          const email = alumnos[0].correo || alumnos[0].email || '';
          const match = email.match(/(\d+)@/);
          if (match) return match[1];
        }
        return 'N/A';
      }
      
      // Si es string, convertir a string por seguridad
      const alumnosStr = String(alumnos);
      
      // Si es un string JSON
      if (alumnosStr.trim().startsWith('[')) {
        const alumnosArray = JSON.parse(alumnosStr);
        if (alumnosArray.length > 0) {
          // Buscar matrícula en el objeto
          if (alumnosArray[0].matricula) return alumnosArray[0].matricula;
          
          // Extraer de correo
          const email = alumnosArray[0].correo || alumnosArray[0].email || '';
          const match = email.match(/(\d+)@/);
          if (match) return match[1];
        }
        return 'N/A';
      }
      
      // Si es texto plano, buscar patrón de matrícula
      const matchMatricula = alumnosStr.match(/(\d{8,10})/);
      if (matchMatricula) return matchMatricula[1];
      
      // Buscar patrón de email
      const matchEmail = alumnosStr.match(/(\d+)@/);
      if (matchEmail) return matchEmail[1];
      
      return 'N/A';
    } catch (error) {
      console.warn('Error extrayendo matrícula:', error, alumnos);
      return 'N/A';
    }
  };

  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'borrador' | 'en_revision' | 'aprobado' | 'rechazado'>('all');
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{ [key: number]: string }>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Estados para filtros de tecnologías y base de datos
  const [techFilter, setTechFilter] = useState<string[]>([]);
  const [dbFilter, setDbFilter] = useState<string[]>([]);
  const [currentTech, setCurrentTech] = useState('');
  const [currentDb, setCurrentDb] = useState('');

  // Función para cargar previsualización de PDF
  const loadPreviewUrl = async (projectId: number) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return null;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/projects/${projectId}/archivo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        return url;
      }
    } catch (error) {
      console.error(`Error cargando preview para proyecto ${projectId}:`, error);
    }
    return null;
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setError('');
        
        // Cargar todos los proyectos desde la API
        const response = await projectsAPI.getAll();
        console.log('Respuesta de la API:', response);
        
        // La API puede devolver directamente un array o un objeto con datos
        let projectsData = [];
        if (Array.isArray(response)) {
          projectsData = response;
        } else if (response && response.projects) {
          projectsData = response.projects;
        } else if (response && response.data) {
          projectsData = response.data;
        }
        
        setProjects(projectsData);
        console.log(`${projectsData.length} proyectos cargados desde la base de datos`);
        
        // Cargar previsualizaciones de PDFs para proyectos que tienen archivo
        const previews: { [key: number]: string } = {};
        for (const project of projectsData) {
          if (project.archivo && project.id_proyecto) {
            const previewUrl = await loadPreviewUrl(project.id_proyecto);
            if (previewUrl) {
              previews[project.id_proyecto] = previewUrl;
            }
          }
        }
        setPreviewUrls(previews);
        
      } catch (error) {
        console.error('Error al cargar proyectos desde API:', error);
        setError('Error al cargar proyectos desde el servidor.');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
    
    // Cleanup: Liberar las URLs de las previsualizaciones cuando el componente se desmonte
    return () => {
      Object.values(previewUrls).forEach(url => {
        if (url) {
          window.URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showViewModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup: asegurar que se restaure el scroll al desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showViewModal]);

  // Funciones para manejar los botones
  const handleViewProject = async (project: Project) => {
    setSelectedProject(project);
    setShowViewModal(true);
    
    // Cargar el PDF si existe
    if (project.archivo) {
      try {
        const token = sessionStorage.getItem('token');
        if (token) {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const response = await fetch(`${API_URL}/projects/${project.id_proyecto}/archivo`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
          } else {
            console.warn(`PDF no encontrado para el proyecto ${project.id_proyecto}`);
            setPdfUrl(null);
          }
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
        setPdfUrl(null);
      }
    } else {
      setPdfUrl(null);
    }
    
    setTimeout(() => setIsModalVisible(true), 50);
  };

  const closeViewModal = () => {
    setIsModalVisible(false);
    setTimeout(() => {
      setShowViewModal(false);
      setSelectedProject(null);
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }, 300);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowUploadModal(true);
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const reloadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll();
      
      let projectsData = [];
      if (Array.isArray(response)) {
        projectsData = response;
      } else if (response && response.projects) {
        projectsData = response.projects;
      } else if (response && response.data) {
        projectsData = response.data;
      }
      
      setProjects(projectsData);
      console.log(`${projectsData.length} proyectos recargados desde la base de datos`);
    } catch (error) {
      console.error('Error al recargar proyectos:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedProject) return;
    
    try {
      await projectsAPI.delete(selectedProject.id_proyecto);
      
      // Recargar la lista completa desde el servidor en lugar de filtrar localmente
      await reloadProjects();
      
      setShowDeleteModal(false);
      setSelectedProject(null);
      alert('Proyecto eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar proyecto:', error);
      
      // Mostrar mensaje específico según el tipo de error
      if (error.response?.status === 403) {
        alert('No tienes permisos para eliminar este proyecto');
      } else if (error.response?.status === 404) {
        alert('El proyecto no fue encontrado');
      } else if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Error al eliminar el proyecto. Inténtalo de nuevo.');
      }
    }
  };

  // Funciones para manejar tags de tecnologías
  const handleAddTech = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTech.trim()) {
      e.preventDefault();
      if (!techFilter.includes(currentTech.trim())) {
        setTechFilter([...techFilter, currentTech.trim()]);
      }
      setCurrentTech('');
    }
  };

  const handleRemoveTech = (tech: string) => {
    setTechFilter(techFilter.filter(t => t !== tech));
  };

  // Funciones para manejar tags de base de datos
  const handleAddDb = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentDb.trim()) {
      e.preventDefault();
      if (!dbFilter.includes(currentDb.trim())) {
        setDbFilter([...dbFilter, currentDb.trim()]);
      }
      setCurrentDb('');
    }
  };

  const handleRemoveDb = (db: string) => {
    setDbFilter(dbFilter.filter(d => d !== db));
  };

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === 'all' || project.estatus === filter || project.estado === filter;
    const matchesSearch = project.titulo.toLowerCase().includes(search.toLowerCase()) ||
                         project.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
                         project.asignatura?.toLowerCase().includes(search.toLowerCase());
    
    // Filtro de tecnologías - TODAS las tecnologías deben estar presentes (AND)
    const matchesTech = techFilter.length === 0 || 
      techFilter.every(tech => 
        project.tecnologias?.some(projectTech => 
          projectTech.toLowerCase().includes(tech.toLowerCase())
        )
      );
    
    // Filtro de base de datos - TODAS las bases de datos deben estar presentes (AND)
    const matchesDb = dbFilter.length === 0 || 
      dbFilter.every(db => {
        if (typeof project.baseDatos === 'string') {
          return project.baseDatos.toLowerCase().includes(db.toLowerCase());
        } else if (Array.isArray(project.baseDatos)) {
          return project.baseDatos.some(projectDb => 
            projectDb.toLowerCase().includes(db.toLowerCase())
          );
        }
        return false;
      });
    
    return matchesFilter && matchesSearch && matchesTech && matchesDb;
  });

  const getStatusBadgeColor = (estatus: string) => {
    switch (estatus) {
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'en_revision':
        return 'bg-yellow-100 text-yellow-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      case 'borrador':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (estatus: string, estado?: string) => {
    // Priorizar el estado si existe (más específico)
    if (estado) {
      switch (estado) {
        case 'pendiente':
          return 'Pendiente';
        case 'en-revision':
          return 'En Revisión';
        case 'aceptado':
          return 'Aceptado';
        case 'rechazado':
          return 'Rechazado';
        default:
          return estado;
      }
    }

    // Usar estatus como fallback
    switch (estatus) {
      case 'aprobado':
        return 'Aprobado';
      case 'en_revision':
        return 'En Revisión';
      case 'rechazado':
        return 'Rechazado';
      case 'borrador':
        return 'Pendiente';
      default:
        return estatus;
    }
  };

  if (loading) {
    return (
      <Layout title="Proyectos">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-gray-600">Cargando proyectos...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Proyectos">
      <style>{`
        .pdf-preview-iframe {
          width: 100%;
          height: 100%;
          border: none;
          pointer-events: none;
          overflow: hidden !important;
          display: block;
          object-fit: contain;
          object-position: center center;
        }
        .pdf-preview-iframe::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .pdf-preview-wrapper {
          overflow: hidden !important;
          -webkit-overflow-scrolling: touch;
        }
        .pdf-preview-wrapper::-webkit-scrollbar {
          display: none !important;
        }
        .pdf-preview-container {
          position: absolute;
          top: -50px;
          left: -50px;
          right: -50px;
          bottom: -50px;
          width: calc(100% + 100px);
          height: calc(100% + 100px);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Proyectos</h1>
            <p className="text-gray-600 mb-6">
              Revisa todos los proyectos académicos. Total: {projects.length} proyectos
            </p>

            {/* Indicador de error */}
            {error && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-yellow-800">{error}</p>
                </div>
              </div>
            )}

            {/* Filtros y búsqueda */}
            <div className="mb-6 space-y-4">
              {/* Primera fila: Búsqueda y estado */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="search" className="sr-only">Buscar proyectos</label>
                  <input
                    type="text"
                    id="search"
                    placeholder="Buscar por título, descripción o asignatura..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="borrador">Pendiente</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                  <button
                    onClick={reloadProjects}
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Actualizar lista de proyectos"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Segunda fila: Filtros de tecnologías y base de datos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filtro de Tecnologías */}
                <div>
                  <label htmlFor="tech-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Tecnologías
                  </label>
                  <input
                    type="text"
                    id="tech-filter"
                    placeholder="Escribe y presiona Enter..."
                    value={currentTech}
                    onChange={(e) => setCurrentTech(e.target.value)}
                    onKeyDown={handleAddTech}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {techFilter.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {techFilter.map((tech, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {tech}
                          <button
                            type="button"
                            onClick={() => handleRemoveTech(tech)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 focus:outline-none"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filtro de Base de Datos */}
                <div>
                  <label htmlFor="db-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Base de Datos
                  </label>
                  <input
                    type="text"
                    id="db-filter"
                    placeholder="Escribe y presiona Enter..."
                    value={currentDb}
                    onChange={(e) => setCurrentDb(e.target.value)}
                    onKeyDown={handleAddDb}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {dbFilter.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dbFilter.map((db, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                        >
                          {db}
                          <button
                            type="button"
                            onClick={() => handleRemoveDb(db)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200 focus:outline-none"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de proyectos */}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proyectos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {projects.length === 0 
                    ? "Aún no tienes proyectos registrados."
                    : "No se encontraron proyectos con los filtros aplicados."
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                  <div key={project.id_proyecto} className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-xl transition-all duration-300 ease-in-out hover:scale-105 overflow-hidden">
                    {/* Previsualización del documento */}
                    {project.archivo && previewUrls[project.id_proyecto] ? (
                      <div className="relative w-full h-48 bg-gray-100 border-b border-gray-200 cursor-pointer pdf-preview-wrapper"
                        onClick={() => handleViewProject(project)}
                      >
                        {/* Contenedor del PDF con márgenes negativos para ocultar scrollbars */}
                        <div className="pdf-preview-container pdf-preview-wrapper transition-transform duration-300 group-hover:scale-105">
                          <iframe
                            src={`${previewUrls[project.id_proyecto]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&page=1&zoom=page-width`}
                            className="pdf-preview-iframe"
                            title={`Vista previa de ${project.titulo}`}
                          />
                        </div>
                        {/* Overlay sutil con gradiente */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    ) : project.archivo ? (
                      <div className="relative w-full h-48 bg-gray-100 border-b border-gray-200 overflow-hidden flex items-center justify-center cursor-pointer"
                        onClick={() => handleViewProject(project)}
                      >
                        <div className="text-center text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">Cargando previsualización...</p>
                        </div>
                      </div>
                    ) : null}
                    
                    <div 
                      className="p-6 cursor-pointer" 
                      onClick={() => handleViewProject(project)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{project.titulo}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(project.estatus)}`}>
                          {getStatusText(project.estatus, project.estado)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.descripcion}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <BookOpen className="w-4 h-4 mr-2" />
                          <span>{project.asignatura}</span>
                        </div>
                        
                        {/* Tecnologías del proyecto */}
                        <div className="flex items-start text-sm text-gray-500">
                          <Tag className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {project.tecnologias && project.tecnologias.length > 0 ? (
                              <>
                                {project.tecnologias.slice(0, 2).map((tech, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {tech}
                                  </span>
                                ))}
                                {project.tecnologias.length > 2 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                    +{project.tecnologias.length - 2}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 text-xs italic">Sin tecnologías</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Nombre del propietario/autor del proyecto */}
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="w-4 h-4 mr-2" />
                          <span className="font-medium text-gray-700">
                            {project.autor || 
                             (project.alumnos && project.alumnos.length > 0 
                               ? project.alumnos[0].nombre 
                               : project.profesor?.nombre || 'Sin propietario')}
                          </span>
                        </div>
                        
                        {/* Fecha de publicación del proyecto */}
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            {project.fechaDefensa 
                              ? project.fechaDefensa
                              : new Date(project.creado_en).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {project.url_repositorio && (
                          <div className="flex items-center text-sm text-gray-500">
                            <FaGithub className="w-4 h-4 mr-2" />
                            <a 
                              href={project.url_repositorio} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 truncate"
                            >
                              Repositorio
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                        {canEditProject(project) && (
                          <button 
                            onClick={() => handleEditProject(project)}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </button>
                        )}
                        {canDeleteProject(project) && (
                          <button 
                            onClick={() => handleDeleteProject(project)}
                            className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Ver Proyecto - Estilo Revisiones */}
      {showViewModal && selectedProject && (
        <div 
          className={`fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
            isModalVisible ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeViewModal();
            }
          }}
        >
          <div 
            className={`bg-white rounded-lg w-full max-h-[90vh] overflow-hidden transition-all duration-500 ease-out ${
              pdfUrl ? 'max-w-[95vw]' : 'max-w-4xl'
            } ${
              isModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Detalles del Proyecto</h2>
              <button
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Contenedor principal con dos columnas si hay PDF */}
            <div className={`flex ${pdfUrl ? 'h-[calc(90vh-80px)]' : ''}`}>
              {/* Columna izquierda: Detalles del proyecto */}
              <div className={`${pdfUrl ? 'w-1/2 overflow-y-auto border-r border-gray-200' : 'w-full'} px-6 py-4 space-y-6`}>
                {/* Información Principal */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información Principal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Título</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedProject.titulo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedProject.estatus)}`}>
                        {getStatusText(selectedProject.estatus, selectedProject.estado)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Autor</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProject.autor || 
                         (selectedProject.alumnos && selectedProject.alumnos.length > 0 
                           ? selectedProject.alumnos[0].nombre 
                           : 'Sin autor especificado')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Matrícula</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {extraerMatricula(selectedProject.alumnos_data)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Correo Institucional</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {(() => {
                          try {
                            if (!selectedProject.alumnos_data) return 'N/A';
                            
                            let alumnosArray: any[] = [];
                            
                            // Si ya es un array
                            if (Array.isArray(selectedProject.alumnos_data)) {
                              alumnosArray = selectedProject.alumnos_data;
                            } else {
                              // Si es string, intentar parsear como JSON
                              const alumnosStr = String(selectedProject.alumnos_data);
                              if (alumnosStr.trim().startsWith('[')) {
                                alumnosArray = JSON.parse(alumnosStr);
                              }
                            }
                            
                            return alumnosArray.length > 0 ? (alumnosArray[0]?.correo || alumnosArray[0]?.email || 'N/A') : 'N/A';
                          } catch {
                            return 'N/A';
                          }
                        })()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Asesor</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProject.asesor || 
                         selectedProject.profesor?.nombre || 
                         'Sin asesor especificado'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Programa Académico</label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {selectedProject.programa || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tipo de Proyecto</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedProject.asignatura || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha de Publicación</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedProject.fechaDefensa || 'No especificada'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">GitHub</label>
                      {selectedProject.url_repositorio && selectedProject.url_repositorio !== '#' ? (
                        <a 
                          href={selectedProject.url_repositorio} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-1 text-sm text-orange-600 hover:text-orange-800 break-all"
                        >
                          {selectedProject.url_repositorio}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">No se especificó repositorio</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedProject.descripcion || 'Sin descripción'}
                  </p>
                </div>

                {/* Tecnologías */}
                {selectedProject.tecnologias && selectedProject.tecnologias.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tecnologías</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tecnologias.map((tech, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Base de Datos */}
                {selectedProject.baseDatos && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Base de Datos</h3>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(selectedProject.baseDatos) 
                        ? selectedProject.baseDatos 
                        : [selectedProject.baseDatos]
                      ).map((db, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                        >
                          {db}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Integrantes del Equipo */}
                <div>
                  {(() => {
                    try {
                      let alumnosArray: any[] = [];
                      
                      if (!selectedProject.alumnos_data) {
                        alumnosArray = [];
                      } else if (Array.isArray(selectedProject.alumnos_data)) {
                        alumnosArray = selectedProject.alumnos_data;
                      } else {
                        const alumnosStr = String(selectedProject.alumnos_data);
                        if (alumnosStr.trim().startsWith('[')) {
                          alumnosArray = JSON.parse(alumnosStr);
                        }
                      }
                      
                      return (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Integrantes del Equipo ({alumnosArray.length || 0})
                          </label>
                          {alumnosArray.length > 0 ? (
                            <div className="space-y-2">
                              {alumnosArray.map((alumno: any, index: number) => (
                                <div key={alumno.id_usuario || index} className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm font-medium text-gray-900">
                                    {alumno.nombre || 'Nombre no especificado'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {alumno.correo || alumno.email || 'Sin correo'} - {alumno.matricula || extraerMatricula(alumno.correo || alumno.email || '') || 'Sin matrícula'}
                                  </p>
                                  {alumno.rol && (
                                    <p className="text-xs text-gray-500 capitalize">{alumno.rol}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                              No se han registrado integrantes para este proyecto
                            </p>
                          )}
                        </>
                      );
                    } catch {
                      return (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Integrantes del Equipo (0)
                          </label>
                          <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                            Error al procesar la información de integrantes
                          </p>
                        </>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Columna derecha: Visor de PDF (solo si hay PDF) */}
              {pdfUrl && (
                <div className="w-1/2 bg-gray-100 flex flex-col">
                  <div className="px-4 py-3 bg-gray-200 border-b border-gray-300 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Documento del Proyecto</h3>
                    <button
                      onClick={() => {
                        if (pdfUrl) {
                          window.open(pdfUrl, '_blank');
                        }
                      }}
                      className="text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                    >
                      Abrir en nueva pestaña
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full border-0"
                      title="PDF del Proyecto"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-red-500 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Confirmar Eliminación</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                ¿Estás seguro de que deseas eliminar el proyecto "{selectedProject.titulo}"?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Esta acción no se puede deshacer.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición usando el componente UploadProject */}
      {showUploadModal && selectedProject && (
        <UploadProject
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedProject(null);
            reloadProjects(); // Recargar proyectos después de editar
          }}
          isEditMode={true}
          projectToEdit={selectedProject}
        />
      )}
    </Layout>
  );
};

export default Projects;