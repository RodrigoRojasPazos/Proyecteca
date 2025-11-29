import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { projectsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Project {
  id_proyecto: number;
  titulo: string;
  descripcion: string;
  autor: string;
  asesor: string;
  programa: string;
  fechaDefensa: string;
  url_repositorio: string;
  baseDatos: string[];
  tecnologias: string[];
  alumnos_data: any; // Puede ser string JSON o array de alumnos
  archivo: string | null; // Nombre del archivo subido
  profesor: {
    id_usuario: number;
    nombre: string;
    correo?: string;
    email?: string; // Mantener compatibilidad
    rol: string;
    matricula: string;
    creado_en: string;
  };
  creado_en: string;
  estado?: 'pendiente' | 'en-revision' | 'aceptado' | 'rechazado';
  asignatura: string;
  tipo: string;
  tipoEstancia?: string; // Tipo de proyecto (Estancias I, Estancias II, Estadía, Proyecto Integrador)
  estatus: string;
  // Campos para revisión
  motivo_rechazo?: string;
  comentarios?: string;
}

const Revisiones: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]); // Todos los proyectos para conteo global
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [isRejectFromDetails, setIsRejectFromDetails] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [comentarioAlumno, setComentarioAlumno] = useState('');
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const projectsPerPage = 12;

  // Funciones para manejar animaciones suaves de modales
  const openProjectModal = async (project: Project) => {
    setProyectoSeleccionado(project);
    
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

  const closeProjectModal = () => {
    setIsModalVisible(false);
    setTimeout(() => {
      setProyectoSeleccionado(null);
      setComentarioAlumno(''); // Limpiar comentario
      // Limpiar la URL del PDF
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }, 300);
  };

  const openRejectModal = (fromDetails = false) => {
    setIsRejectFromDetails(fromDetails);
    // Solo desactivar la visibilidad del modal principal si venimos desde detalles
    if (fromDetails) {
      setIsModalVisible(false);
    }
    setShowRejectModal(true);
    setTimeout(() => setIsRejectModalVisible(true), 50);
  };

  const closeRejectModal = () => {
    setIsRejectModalVisible(false);
    setTimeout(() => {
      setShowRejectModal(false);
      setRejectReason('');
      // Solo reactivar animación si venimos desde el modal de detalles
      if (isRejectFromDetails) {
        // Dar un poco más de tiempo para que la animación se vea bien
        setTimeout(() => setIsModalVisible(true), 100);
      } else {
        // Si venimos desde la tarjeta, limpiar el proyecto seleccionado
        setProyectoSeleccionado(null);
      }
      setIsRejectFromDetails(false); // Reset del flag
    }, 300);
  };

  // Función para extraer matrícula del campo alumnos
  const extraerMatricula = (alumnos: any): string => {
    if (!alumnos) return 'N/A';
    
    try {
      // Si es un array directo
      if (Array.isArray(alumnos)) {
        if (alumnos.length > 0 && alumnos[0]) {
          const primerAlumno = alumnos[0];
          if (primerAlumno.matricula) return primerAlumno.matricula;
          if (primerAlumno.correo) {
            const match = primerAlumno.correo.match(/^(\d+)@/);
            if (match) return match[1];
          }
          if (primerAlumno.email) {
            const match = primerAlumno.email.match(/^(\d+)@/);
            if (match) return match[1];
          }
        }
        return 'N/A';
      }
      
      // Si es string, convertir a string por seguridad
      const alumnosStr = String(alumnos);
      
      // Si es un string JSON
      if (alumnosStr.trim().startsWith('[')) {
        const alumnosArray = JSON.parse(alumnosStr);
        if (alumnosArray.length > 0 && alumnosArray[0]) {
          const primerAlumno = alumnosArray[0];
          if (primerAlumno.matricula) return primerAlumno.matricula;
          if (primerAlumno.correo) {
            const match = primerAlumno.correo.match(/^(\d+)@/);
            if (match) return match[1];
          }
          if (primerAlumno.email) {
            const match = primerAlumno.email.match(/^(\d+)@/);
            if (match) return match[1];
          }
        }
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

  const loadProjects = async () => {
    // Solo cargar proyectos si hay un usuario autenticado y es profesor, asesor o director
    if (!user || (user.rol !== 'profesor' && user.rol !== 'asesor' && user.rol !== 'director')) {
      setLoading(false);
      setError('Acceso restringido. Solo profesores, asesores y directores pueden ver las revisiones.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      // Loading projects...
      
      // Primero, cargar TODOS los proyectos sin límite para el conteo global
      const allProjectsResponse = await projectsAPI.getAll({ limit: 999999 }); // Sin límite real
      const allProjectsData = allProjectsResponse.projects || allProjectsResponse.data || allProjectsResponse;
      
      // Procesar todos los proyectos
      const allProjectsWithStatus = allProjectsData.map((project: any) => {
        return {
          ...project,
          estado: project.estado || 'pendiente',
          titulo: project.titulo || 'Sin título',
          descripcion: project.descripcion || 'Sin descripción',
          autor: project.autor || project.alumnos?.[0]?.nombre || 'Sin autor',
          asesor: project.asesor || project.profesor?.nombre || 'Sin asesor',
          programa: project.programa || 'Sin especificar',
          asignatura: project.asignatura || 'Sin especificar',
          tipo: project.tipo || 'Sin especificar',
          fechaDefensa: project.fechaDefensa || project.fecha_defensa || 'Sin fecha',
          url_repositorio: project.url_repositorio || project.repositorio_url || '#',
          tecnologias: Array.isArray(project.tecnologias) ? project.tecnologias : 
                      typeof project.tecnologias === 'string' ? project.tecnologias.split(',').map((t: string) => t.trim()) : [],
          baseDatos: Array.isArray(project.baseDatos) ? project.baseDatos : 
                    typeof project.baseDatos === 'string' ? project.baseDatos.split(',').map((db: string) => db.trim()) : [],
          alumnos_data: project.alumnos_data || project.alumnos || null,
          archivo: project.archivo || null,
          profesor: project.profesor || (project.alumnos?.[0] ? {
            id_usuario: 0,
            nombre: project.asesor || 'Sin asesor',
            correo: '',
            rol: 'profesor',
            matricula: '',
            creado_en: ''
          } : null)
        };
      });
      
      // Filtrar todos los proyectos según el rol del usuario
      let allFilteredProjects = allProjectsWithStatus;
      if (user && (user.rol === 'profesor' || user.rol === 'asesor')) {
        allFilteredProjects = allProjectsWithStatus.filter((project: any) => {
          const isAsesor = project.profesor_id === user.id_usuario || 
                         project.profesor?.id_usuario === user.id_usuario ||
                         (project.asesor && project.asesor.toLowerCase().includes(user.nombre.toLowerCase()));
          return isAsesor;
        });
      }
      
      // Guardar todos los proyectos filtrados para conteo global
      setAllProjects(allFilteredProjects);
      
      // Filtrar proyectos del lado del cliente según el filtro de estado seleccionado
      let projectsToShow = allFilteredProjects;
      if (filtroEstado !== 'todos') {
        projectsToShow = allFilteredProjects.filter((project: any) => project.estado === filtroEstado);
      }
      
      // Aplicar paginación del lado del cliente
      const totalFilteredProjects = projectsToShow.length;
      const startIndex = (currentPage - 1) * projectsPerPage;
      const endIndex = startIndex + projectsPerPage;
      const paginatedProjects = projectsToShow.slice(startIndex, endIndex);
      
      setProjects(paginatedProjects);
      setTotalPages(Math.ceil(totalFilteredProjects / projectsPerPage));
      setTotalProjects(totalFilteredProjects);
      
      // Projects loaded successfully
      
      if (paginatedProjects.length === 0) {
        if (user?.rol === 'profesor') {
          setError('No tienes proyectos asignados como asesor.');
        } else {
          setError('No tienes ningún proyecto asesorado.');
        }
      } else {
        setError(''); // Limpiar error si hay datos
      }
      
    } catch (error: any) {
      console.error('Error loading projects from API:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setError(`Error del servidor: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const reloadProjects = async () => {
    await loadProjects();
  };

  useEffect(() => {
    loadProjects();
  }, [user, currentPage, filtroEstado]); // Agregar filtroEstado como dependencia
  
  // Resetear a la primera página cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroEstado]);

  // Bloquear scroll del body cuando el modal de detalles está abierto
  useEffect(() => {
    if (proyectoSeleccionado && !showRejectModal) {
      // Bloquear scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar scroll
      document.body.style.overflow = 'unset';
    }

    // Cleanup: asegurar que se restaure el scroll al desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [proyectoSeleccionado, showRejectModal]);

  const actualizarEstadoProyecto = async (projectId: number, nuevoEstado: 'pendiente' | 'en-revision' | 'aceptado' | 'rechazado', motivoRechazo?: string) => {
    try {
      // Updating project status...
      
      // Preparar datos para actualizar
      const updateData: any = { 
        estado: nuevoEstado,
        estatus: nuevoEstado === 'pendiente' ? 'borrador' : 
                nuevoEstado === 'en-revision' ? 'en_revision' :
                nuevoEstado === 'aceptado' ? 'aprobado' : 'rechazado'
      };
      
      // Si es rechazo y hay motivo, agregarlo solo en motivo_rechazo
      if (nuevoEstado === 'rechazado' && motivoRechazo) {
        updateData.motivo_rechazo = motivoRechazo;
      }
      
      // Actualizar en la API
      await projectsAPI.update(projectId, updateData);
      
      // Project status updated successfully
      
      // Recargar proyectos desde el servidor para mantener consistencia
      await reloadProjects();
      
      // Cerrar el modal después de actualizar con animación
      closeProjectModal();
    } catch (error) {
      console.error('Error updating project status:', error);
      
      // Mostrar error específico al usuario
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al actualizar el estado del proyecto: ${errorMessage}`);
      
      // Recargar proyectos desde la base de datos para mantener consistencia
      await reloadProjects();
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en-revision':
        return 'bg-blue-100 text-blue-800';
      case 'aceptado':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoLabel = (estado: string) => {
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
        return 'Sin Estado';
    }
  };

  const contarPorEstado = (estado: string) => {
    // Usar allProjects en lugar de projects para contar globalmente
    return allProjects.filter(project => project.estado === estado).length;
  };

  return (
    <Layout title="Revisiones">
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Revisiones de Proyectos</h1>
            </div>
            <p className="text-gray-600 mb-6">
              {user?.rol === 'profesor' 
                ? 'Revisa y evalúa los proyectos donde eres asesor'
                : 'Revisa y evalúa los proyectos estudiantiles'
              }
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

            {/* Indicador de carga */}
            {loading && (
              <div className="mb-6 flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-2 text-gray-600">Cargando proyectos...</span>
              </div>
            )}

            {/* Estado cuando no hay datos y no está cargando */}
            {!loading && projects.length === 0 && !error && (
              <div className="mb-6 text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proyectos</h3>
                <p className="mt-1 text-sm text-gray-500">Aún no se han subido proyectos para revisar.</p>
              </div>
            )}

            {/* Mostrar tarjetas siempre, incluso si no hay proyectos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 - Proyectos Pendientes */}
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Pendientes</h3>
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 flex-grow">
                  Proyectos que requieren revisión
                </p>
                <div className="text-2xl font-bold text-yellow-600 mb-4 min-h-[3rem] flex items-center">
                  {contarPorEstado('pendiente')}
                </div>
                <button 
                  onClick={() => setFiltroEstado('pendiente')}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors mt-auto"
                >
                  Ver Pendientes
                </button>
              </div>

              {/* Card 2 - En Revisión */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">En Revisión</h3>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 flex-grow">
                  Proyectos en proceso de evaluación
                </p>
                <div className="text-2xl font-bold text-blue-600 mb-4 min-h-[3rem] flex items-center">
                  {contarPorEstado('en-revision')}
                </div>
                <button 
                  onClick={() => setFiltroEstado('en-revision')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-auto"
                >
                  Ver En Revisión
                </button>
              </div>

              {/* Card 3 - Aceptados */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Aceptados</h3>
                  <div className="p-2 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 flex-grow">
                  Proyectos aprobados
                </p>
                <div className="text-2xl font-bold text-green-600 mb-4 min-h-[3rem] flex items-center">
                  {contarPorEstado('aceptado')}
                </div>
                <button 
                  onClick={() => setFiltroEstado('aceptado')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-auto"
                >
                  Ver Aceptados
                </button>
              </div>

              {/* Card 4 - Rechazados */}
              <div className="bg-red-50 p-6 rounded-lg border border-red-200 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Rechazados</h3>
                  <div className="p-2 bg-red-100 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 flex-grow">
                  Proyectos no aprobados
                </p>
                <div className="text-2xl font-bold text-red-600 mb-4 min-h-[3rem] flex items-center">
                  {contarPorEstado('rechazado')}
                </div>
                <button 
                  onClick={() => setFiltroEstado('rechazado')}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mt-auto"
                >
                  Ver Rechazados
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="mt-8 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFiltroEstado('todos')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filtroEstado === 'todos' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Todos
                </button>
              <button
                onClick={() => setFiltroEstado('pendiente')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filtroEstado === 'pendiente' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pendientes ({contarPorEstado('pendiente')})
              </button>
              <button
                onClick={() => setFiltroEstado('en-revision')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filtroEstado === 'en-revision' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                En Revisión ({contarPorEstado('en-revision')})
              </button>
              <button
                onClick={() => setFiltroEstado('aceptado')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filtroEstado === 'aceptado' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Aceptados ({contarPorEstado('aceptado')})
              </button>
                <button
                  onClick={() => setFiltroEstado('rechazado')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filtroEstado === 'rechazado' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Rechazados ({contarPorEstado('rechazado')})
                </button>
              </div>
              
              <button
                onClick={reloadProjects}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Actualizar lista de proyectos"
              >
                <svg 
                  className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Lista de Proyectos para Revisión */}
            <div className="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {filtroEstado === 'todos' ? 'Todos los Proyectos' : `Proyectos ${getEstadoLabel(filtroEstado)}`}
                  <span className="ml-2 text-sm text-gray-500">({totalProjects})</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div 
                      key={project.id_proyecto} 
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        console.log('Proyecto seleccionado desde tarjeta:', project);
                        openProjectModal(project);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{project.titulo}</h4>
                          <p className="text-sm text-gray-600">Por: {project.autor} ({extraerMatricula(project.alumnos_data)})</p>
                          <p className="text-sm text-gray-500">
                            {project.asignatura === 'Proyecto Integrador' || project.tipoEstancia === 'Proyecto Integrador' ? 'Profesor' : 'Asesor'}: {project.asesor}
                          </p>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">{project.programa || 'Programa no especificado'}</span> - {project.asignatura}
                          </p>

                          
                          {/* Tecnologías y Bases de Datos */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(project.tecnologias || []).slice(0, 3).map((tech, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {tech}
                              </span>
                            ))}
                            {(project.tecnologias || []).length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                +{(project.tecnologias || []).length - 3} más
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(project.estado || 'pendiente')}`}>
                              {getEstadoLabel(project.estado || 'pendiente')}
                            </span>
                            <span className="text-xs text-gray-500">
                              Publicado: {project.fechaDefensa || new Date(project.creado_en).toLocaleDateString()}
                            </span>
                            <a 
                              href={project.url_repositorio} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-orange-600 hover:text-orange-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Ver GitHub
                            </a>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          {/* Botones de cambio de estado */}
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                actualizarEstadoProyecto(project.id_proyecto, 'pendiente');
                              }}
                              className={`group flex items-center justify-center gap-2 px-3 py-1 text-xs rounded transition-all duration-[1500ms] overflow-hidden ${
                                project.estado === 'pendiente' 
                                  ? 'bg-yellow-600 text-white' 
                                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              }`}
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="max-w-0 group-hover:max-w-xs transition-all duration-[1500ms] whitespace-nowrap overflow-hidden">
                                Pendiente
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                actualizarEstadoProyecto(project.id_proyecto, 'en-revision');
                              }}
                              className={`group flex items-center justify-center gap-2 px-3 py-1 text-xs rounded transition-all duration-[1500ms] overflow-hidden ${
                                project.estado === 'en-revision' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                              <span className="max-w-0 group-hover:max-w-xs transition-all duration-[1500ms] whitespace-nowrap overflow-hidden">
                                En Revisión
                              </span>
                            </button>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                actualizarEstadoProyecto(project.id_proyecto, 'aceptado');
                              }}
                              className={`group flex items-center justify-center gap-2 px-3 py-1 text-xs rounded transition-all duration-[1500ms] overflow-hidden ${
                                project.estado === 'aceptado' 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="max-w-0 group-hover:max-w-xs transition-all duration-[1500ms] whitespace-nowrap overflow-hidden">
                                Aceptar
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProyectoSeleccionado(project);
                                openRejectModal(false); // false = desde tarjeta
                                setRejectReason('');
                              }}
                              className={`group flex items-center justify-center gap-2 px-3 py-1 text-xs rounded transition-all duration-[1500ms] overflow-hidden ${
                                project.estado === 'rechazado' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="max-w-0 group-hover:max-w-xs transition-all duration-[1500ms] whitespace-nowrap overflow-hidden">
                                Rechazar
                              </span>
                            </button>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Proyecto seleccionado:', project);
                              openProjectModal(project);
                            }}
                            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-sm">
                      {filtroEstado === 'todos' 
                        ? 'No hay proyectos para revisar' 
                        : `No hay proyectos ${getEstadoLabel(filtroEstado).toLowerCase()}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex flex-col items-center gap-4">
                  {/* Información de paginación */}
                  <div className="text-sm text-gray-600">
                    Mostrando <span className="font-medium">{((currentPage - 1) * projectsPerPage) + 1}</span> - <span className="font-medium">{Math.min(currentPage * projectsPerPage, totalProjects)}</span> de <span className="font-medium">{totalProjects}</span> proyectos
                  </div>
                  
                  {/* Navegación de páginas */}
                  <nav className="flex items-center gap-2">
                    {/* Botón Anterior */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-500 text-white border border-orange-600 hover:bg-orange-600 shadow-sm'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Anterior
                    </button>

                    {/* Números de Página */}
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-orange-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Indicador de página en móvil */}
                    <div className="sm:hidden px-4 py-2 bg-orange-100 rounded-lg text-sm font-medium text-orange-800">
                      Página {currentPage} de {totalPages}
                    </div>

                    {/* Botón Siguiente */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-500 text-white border border-orange-600 hover:bg-orange-600 shadow-sm'
                      }`}
                    >
                      Siguiente
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal de Detalles del Proyecto con animaciones suaves */}
        {proyectoSeleccionado && !showRejectModal && (
          <div 
            className={`fixed bg-black flex items-center justify-center p-4 z-[9999] transition-all duration-500 ease-in-out ${
              isModalVisible ? 'bg-opacity-50' : 'bg-opacity-0'
            }`}
            style={{ 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              position: 'fixed',
              width: '100vw',
              height: '100vh',
              margin: 0,
              padding: '16px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeProjectModal();
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
                  onClick={() => closeProjectModal()}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                      <p className="mt-1 text-sm text-gray-900">{proyectoSeleccionado.titulo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(proyectoSeleccionado.estado || 'pendiente')}`}>
                        {getEstadoLabel(proyectoSeleccionado.estado || 'pendiente')}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Autor</label>
                      <p className="mt-1 text-sm text-gray-900">{proyectoSeleccionado.autor || 'Sin autor especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Matrícula</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {extraerMatricula(proyectoSeleccionado.alumnos_data)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Correo Institucional</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {(() => {
                          try {
                            if (!proyectoSeleccionado.alumnos_data) return 'N/A';
                            
                            let alumnosArray: any[] = [];
                            
                            // Si ya es un array
                            if (Array.isArray(proyectoSeleccionado.alumnos_data)) {
                              alumnosArray = proyectoSeleccionado.alumnos_data;
                            } else {
                              // Si es string, intentar parsear como JSON
                              const alumnosStr = String(proyectoSeleccionado.alumnos_data);
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
                      <label className="block text-sm font-medium text-gray-700">
                        {proyectoSeleccionado.asignatura === 'Proyecto Integrador' || proyectoSeleccionado.tipoEstancia === 'Proyecto Integrador' ? 'Profesor' : 'Asesor'}
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {proyectoSeleccionado.asesor || proyectoSeleccionado.profesor?.nombre || 
                         (proyectoSeleccionado.asignatura === 'Proyecto Integrador' || proyectoSeleccionado.tipoEstancia === 'Proyecto Integrador' 
                           ? 'Sin profesor especificado' 
                           : 'Sin asesor especificado')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Programa Académico</label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {proyectoSeleccionado.programa || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tipo de Proyecto</label>
                      <p className="mt-1 text-sm text-gray-900">{proyectoSeleccionado.asignatura}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha de Publicación</label>
                      <p className="mt-1 text-sm text-gray-900">{proyectoSeleccionado.fechaDefensa}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">GitHub</label>
                      {proyectoSeleccionado.url_repositorio && proyectoSeleccionado.url_repositorio !== '#' ? (
                        <a 
                          href={proyectoSeleccionado.url_repositorio} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-1 text-sm text-orange-600 hover:text-orange-800 break-all"
                        >
                          {proyectoSeleccionado.url_repositorio}
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
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{proyectoSeleccionado.descripcion}</p>
                </div>

                {/* Integrantes */}
                <div>
                  {(() => {
                    try {
                      let alumnosArray: any[] = [];
                      
                      if (!proyectoSeleccionado.alumnos_data) {
                        alumnosArray = [];
                      } else if (Array.isArray(proyectoSeleccionado.alumnos_data)) {
                        alumnosArray = proyectoSeleccionado.alumnos_data;
                      } else {
                        const alumnosStr = String(proyectoSeleccionado.alumnos_data);
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

                {/* Información del Profesor/Asesor */}
                {proyectoSeleccionado.profesor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Información del {proyectoSeleccionado.asignatura === 'Proyecto Integrador' || proyectoSeleccionado.tipoEstancia === 'Proyecto Integrador' ? 'Profesor' : 'Asesor'}
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">
                        {proyectoSeleccionado.profesor.nombre || 'Nombre no especificado'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {proyectoSeleccionado.profesor.correo || 'Sin correo'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {proyectoSeleccionado.asignatura === 'Proyecto Integrador' || proyectoSeleccionado.tipoEstancia === 'Proyecto Integrador' ? 'profesor' : 'asesor'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tecnologías */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tecnologías Utilizadas</label>
                  <div className="flex flex-wrap gap-2">
                    {(proyectoSeleccionado.tecnologias || []).map((tech, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tech}
                      </span>
                    ))}
                    {(!proyectoSeleccionado.tecnologias || proyectoSeleccionado.tecnologias.length === 0) && (
                      <span className="text-sm text-gray-500">No se especificaron tecnologías</span>
                    )}
                  </div>
                </div>

                {/* Bases de Datos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bases de Datos</label>
                  <div className="flex flex-wrap gap-2">
                    {(proyectoSeleccionado.baseDatos || []).map((db, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {db}
                      </span>
                    ))}
                    {(!proyectoSeleccionado.baseDatos || proyectoSeleccionado.baseDatos.length === 0) && (
                      <span className="text-sm text-gray-500">No se especificaron bases de datos</span>
                    )}
                  </div>
                </div>

                {/* Motivo de Rechazo (solo si está rechazado) */}
                {proyectoSeleccionado.estado === 'rechazado' && proyectoSeleccionado.motivo_rechazo && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-red-800 mb-2">
                      ⚠️ Motivo de Rechazo
                    </label>
                    <p className="text-sm text-red-700 whitespace-pre-wrap">
                      {proyectoSeleccionado.motivo_rechazo}
                    </p>
                  </div>
                )}

                {/* Comentarios del Profesor (separados del motivo de rechazo) */}
                {proyectoSeleccionado.comentarios && proyectoSeleccionado.comentarios !== proyectoSeleccionado.motivo_rechazo && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      💬 Comentarios del Profesor
                    </label>
                    <p className="text-sm text-blue-700 whitespace-pre-wrap">
                      {proyectoSeleccionado.comentarios}
                    </p>
                  </div>
                )}

                {/* Archivo del Proyecto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Archivo del Proyecto</label>
                  {proyectoSeleccionado.archivo ? (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {proyectoSeleccionado.archivo}
                          </p>
                          <p className="text-xs text-gray-500">
                            Documento del proyecto
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500 text-center">
                        No se ha subido ningún archivo para este proyecto
                      </p>
                    </div>
                  )}
                </div>

                {/* Acciones del Proyecto */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Cambiar Estado del Proyecto</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        actualizarEstadoProyecto(proyectoSeleccionado.id_proyecto, 'pendiente');
                        setProyectoSeleccionado({ ...proyectoSeleccionado, estado: 'pendiente' });
                      }}
                      className={`group flex items-center gap-2 px-3 py-2 text-sm rounded transition-all duration-1000 overflow-hidden ${
                        proyectoSeleccionado.estado === 'pendiente' 
                          ? 'bg-yellow-600 text-white' 
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="max-w-0 group-hover:max-w-xs transition-all duration-1000 whitespace-nowrap overflow-hidden">
                        Marcar como Pendiente
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        actualizarEstadoProyecto(proyectoSeleccionado.id_proyecto, 'en-revision');
                        setProyectoSeleccionado({ ...proyectoSeleccionado, estado: 'en-revision' });
                      }}
                      className={`group flex items-center gap-2 px-3 py-2 text-sm rounded transition-all duration-1000 overflow-hidden ${
                        proyectoSeleccionado.estado === 'en-revision' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <span className="max-w-0 group-hover:max-w-xs transition-all duration-1000 whitespace-nowrap overflow-hidden">
                        Poner en Revisión
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        actualizarEstadoProyecto(proyectoSeleccionado.id_proyecto, 'aceptado');
                        setProyectoSeleccionado({ ...proyectoSeleccionado, estado: 'aceptado' });
                      }}
                      className={`group flex items-center gap-2 px-3 py-2 text-sm rounded transition-all duration-1000 overflow-hidden ${
                        proyectoSeleccionado.estado === 'aceptado' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="max-w-0 group-hover:max-w-xs transition-all duration-1000 whitespace-nowrap overflow-hidden">
                        Aceptar Proyecto
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        openRejectModal(true); // true = desde modal de detalles
                        setRejectReason('');
                      }}
                      className={`group flex items-center gap-2 px-3 py-2 text-sm rounded transition-all duration-1000 overflow-hidden ${
                        proyectoSeleccionado.estado === 'rechazado' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="max-w-0 group-hover:max-w-xs transition-all duration-1000 whitespace-nowrap overflow-hidden">
                        Rechazar Proyecto
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sección de Comentarios al Alumno */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Hacer Comentario al Alumno
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Escribe observaciones, sugerencias o feedback para el estudiante sobre su proyecto
                  </p>
                  <textarea
                    value={comentarioAlumno}
                    onChange={(e) => setComentarioAlumno(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    rows={4}
                    placeholder="Escribe tu comentario para el alumno aquí..."
                  />
                  <div className="mt-3 flex justify-end space-x-2">
                    <button
                      onClick={() => setComentarioAlumno('')}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={async () => {
                        if (!comentarioAlumno.trim()) {
                          alert('Por favor, escribe un comentario antes de enviar.');
                          return;
                        }
                        
                        try {
                          // Guardar el comentario y cambiar estado a "en-revision"
                          await projectsAPI.update(proyectoSeleccionado.id_proyecto, {
                            comentarios: comentarioAlumno.trim(),
                            estado: 'en-revision',
                            estatus: 'en_revision'
                          });
                          
                          setComentarioAlumno('');
                          
                          // Actualizar el proyecto seleccionado para reflejar el nuevo estado
                          setProyectoSeleccionado({ 
                            ...proyectoSeleccionado, 
                            estado: 'en-revision' 
                          });
                          
                          // Recargar proyectos
                          await reloadProjects();
                          
                          // Cerrar el modal después de enviar
                          closeProjectModal();
                        } catch (error) {
                          console.error('Error enviando comentario:', error);
                          alert('Error al enviar el comentario. Por favor, inténtalo de nuevo.');
                        }
                      }}
                      disabled={!comentarioAlumno.trim()}
                      className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Enviar Comentario
                    </button>
                  </div>
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

        {/* Modal para motivo de rechazo */}
        {showRejectModal && proyectoSeleccionado && (
          <div 
            className={`fixed bg-black flex items-center justify-center z-[9999] transition-all duration-500 ease-in-out ${
              isRejectModalVisible ? 'bg-opacity-50' : 'bg-opacity-0'
            }`}
            style={{ 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              position: 'fixed',
              width: '100vw',
              height: '100vh',
              margin: 0,
              padding: '16px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeRejectModal();
              }
            }}
          >
            <div 
              className={`bg-white rounded-lg max-w-md w-full p-6 transition-all duration-500 ease-out ${
                isRejectModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Rechazar Proyecto</h3>
                <button
                  onClick={() => closeRejectModal()}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Proyecto: <span className="font-medium">{proyectoSeleccionado.titulo}</span>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del rechazo (requerido)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={4}
                  placeholder="Explica por qué se rechaza el proyecto..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => closeRejectModal()}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (rejectReason.trim()) {
                      actualizarEstadoProyecto(proyectoSeleccionado.id_proyecto, 'rechazado', rejectReason.trim());
                      closeRejectModal();
                    } else {
                      alert('Por favor, proporciona un motivo para el rechazo.');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  disabled={!rejectReason.trim()}
                >
                  Rechazar Proyecto
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Revisiones;