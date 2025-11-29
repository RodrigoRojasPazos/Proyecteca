import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import UploadProject from '../components/UploadProject';
import { Plus, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI } from '../services/api';

// Componente para mostrar la barra de estado del proyecto
const ProjectStatusBar: React.FC<{ 
  project: any; 
  user: any; 
  onShowRejectReason: (project: any) => void;
  onDeleteProject: (project: any) => void;
  onEditProject: (project: any) => void;
}> = ({ project, user, onShowRejectReason, onDeleteProject, onEditProject }) => {
  const getStatusInfo = (status: string) => {
    const statusLower = status?.toLowerCase() || 'pendiente';
    
    switch (statusLower) {
      case 'borrador':
        return {
          text: 'Pendiente',
          color: 'bg-yellow-500',
          icon: Clock,
          progress: 25,
          description: 'Tu proyecto está pendiente de revisión'
        };
      case 'pendiente':
      case 'en_revision':
      case 'en-revision':
        return {
          text: 'En Revisión',
          color: 'bg-yellow-500',
          icon: Clock,
          progress: 50,
          description: 'Tu proyecto está siendo revisado por un profesor'
        };
      case 'aprobado':
      case 'aceptado':
        return {
          text: 'Aprobado',
          color: 'bg-green-500',
          icon: CheckCircle,
          progress: 100,
          description: 'Tu proyecto ha sido aprobado'
        };
      case 'rechazado':
        return {
          text: 'Rechazado',
          color: 'bg-red-500',
          icon: XCircle,
          progress: 75,
          description: 'Tu proyecto necesita revisiones'
        };
      case null:
      case undefined:
      case '':
        return {
          text: 'Pendiente',
          color: 'bg-blue-500',
          icon: Clock,
          progress: 10,
          description: 'Tu proyecto ha sido subido y está pendiente de revisión'
        };
      default:
        return {
          text: 'Sin Estado',
          color: 'bg-gray-400',
          icon: FileText,
          progress: 0,
          description: `Estado: ${status || 'no definido'}`
        };
    }
  };

  const statusInfo = getStatusInfo(project.estatus || project.estado);
  const StatusIcon = statusInfo.icon;
  
  // Determinar si es autor principal o colaborador
  const isAutorPrincipal = Array.isArray(project.alumnos) && project.alumnos.length > 0 && 
    (project.alumnos[0].email === user?.email || project.alumnos[0].correo === user?.email);
  


  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-grow mr-4">
          <h4 className="font-semibold text-gray-900 truncate">
            {project.titulo || 'Proyecto sin título'}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {isAutorPrincipal ? 'Autor principal' : 'Colaborador'}
          </p>
        </div>
        <div className={`flex items-center px-3 py-1 rounded-full text-white text-sm font-medium ${statusInfo.color}`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {statusInfo.text}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{statusInfo.description}</p>
      
      {statusInfo.text !== 'Rechazado' && (
        <>
          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${statusInfo.color}`}
              style={{ width: `${statusInfo.progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progreso</span>
            <span>{statusInfo.progress}%</span>
          </div>
        </>
      )}
      
      {/* Botones para cuando esté rechazado */}
      {statusInfo.text === 'Rechazado' && (
        <div className="mt-3 space-y-2">
          <button
            onClick={() => onShowRejectReason(project)}
            className="w-full bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Ver motivo del rechazo
          </button>
          <button
            onClick={() => onDeleteProject(project)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar proyecto
          </button>
        </div>
      )}

      {/* Comentarios del Profesor */}
      {project.comentarios && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <div className="flex-1">
              <h5 className="text-sm font-semibold text-blue-900 mb-1">
                Comentario del Profesor
              </h5>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                {project.comentarios}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Profesor: {project.asesor || project.profesor?.nombre || 'No especificado'}
              </p>
              {/* Botón para editar el proyecto */}
              <button
                onClick={() => onEditProject(project)}
                className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar Proyecto según Comentarios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Memorias: React.FC = () => {
  const { user } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPrograma, setSelectedPrograma] = useState('');
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const programas: any[] = [];

  // Función para mostrar modal de motivo de rechazo
  const handleShowRejectReason = (project: any) => {
    setSelectedProject(project);
    setShowRejectModal(true);
  };

  // Función para mostrar modal de confirmación de eliminación
  const handleDeleteProject = (project: any) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  // Función para editar el proyecto
  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setIsEditMode(true);
    setIsUploadModalOpen(true);
  };

  // Función para eliminar el proyecto
  const confirmDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await projectsAPI.delete(selectedProject.id_proyecto);
      
      // Actualizar la lista de proyectos eliminando el proyecto
      setUserProjects(prevProjects => 
        prevProjects.filter(p => p.id_proyecto !== selectedProject.id_proyecto)
      );
      
      setShowDeleteModal(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      alert('Error al eliminar el proyecto. Por favor, intenta de nuevo.');
    }
  };

  // Bloquear scroll cuando se abre el modal de eliminar
  useEffect(() => {
    if (showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDeleteModal]);

  // Cargar proyectos del usuario
  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!user?.email) return;
      
      try {
        const response = await projectsAPI.getAll();
        const allProjects = Array.isArray(response) ? response : response?.data || [];
        
        // Filtrar proyectos del usuario actual
        const userProjectsFiltered = allProjects.filter((project: any) => {
          const userEmailNormalized = user.email?.toLowerCase().trim();
          
          // Mostrar SOLO proyectos donde el usuario participa directamente
          if (Array.isArray(project.alumnos) && userEmailNormalized) {
            return project.alumnos.some((alumno: any) => {
              const alumnoEmail = alumno.email?.toLowerCase().trim();
              const alumnoCorreo = alumno.correo?.toLowerCase().trim();
              
              // Comparación exacta de emails
              return alumnoEmail === userEmailNormalized || alumnoCorreo === userEmailNormalized;
            });
          }
          
          return false;
        });

        setUserProjects(userProjectsFiltered);
      } catch (error) {
        console.error('Error al cargar proyectos del usuario:', error);
        console.error('Detalles del error:', error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProjects();
  }, [user?.email]);

  const handleProgramaClick = (programaNombre: string) => {
    setSelectedPrograma(programaNombre);
    setIsUploadModalOpen(true);
  };

  // Función para recargar proyectos cuando se suba uno nuevo
  const handleProjectUploaded = async () => {
    if (!user?.email) return;
    
    try {
      const response = await projectsAPI.getAll();
      const allProjects = Array.isArray(response) ? response : response?.data || [];
      
      // Filtrar proyectos del usuario actual
      const userProjectsFiltered = allProjects.filter((project: any) => {
        const userEmailNormalized = user.email?.toLowerCase().trim();
        
        // Mostrar SOLO proyectos donde el usuario participa directamente
        if (Array.isArray(project.alumnos) && userEmailNormalized) {
          return project.alumnos.some((alumno: any) => {
            const alumnoEmail = alumno.email?.toLowerCase().trim();
            const alumnoCorreo = alumno.correo?.toLowerCase().trim();
            
            // Comparación exacta de emails
            return alumnoEmail === userEmailNormalized || alumnoCorreo === userEmailNormalized;
          });
        }
        
        return false;
      });

      setUserProjects(userProjectsFiltered);
    } catch (error) {
      console.error('Error al recargar proyectos del usuario:', error);
      console.error('Detalles del error al recargar:', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  return (
    <Layout title="Inicio">
      <div className="px-4 py-6 sm:px-0">
        {/* Bloque de bienvenida solo si no hay proyectos */}
        {userProjects.length === 0 && (
          <div className="text-center py-8 animate-in fade-in-0 slide-in-from-top-4 duration-700 ease-out">
            <div className="max-w-md mx-auto">
              <div className="mb-8 animate-in zoom-in-50 duration-700 delay-300 ease-out">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 animate-in slide-in-from-left-4 duration-700 delay-500">Bienvenido a Proyecteca</h3>
              <p className="text-gray-600 mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-700">
                Esta es la plataforma para gestionar los proyectos de titulación de la Universidad Politécnica de Quintana Roo.
              </p>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 animate-in slide-in-from-right-4 duration-700 delay-900">
                <h4 className="font-semibold text-orange-800 mb-2">¿Listo para comenzar?</h4>
                <p className="text-orange-700 text-sm">
                  Utiliza el botón "Subir Proyecto" para agregar tu trabajo de titulación y estancias al repositorio.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Header con botón para subir proyecto */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Subir tu proyecto</h2>
            <p className="text-gray-600 mt-2">Comparte tu trabajo de titulación y estancias con la comunidad académica</p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>Subir Proyecto</span>
          </button>
        </div>

        {/* Sección de Estatus del Proyecto */}
        <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center">
              <FileText className="h-6 w-6 mr-2" />
              Estatus de tu proyecto
            </h3>
            <button
              onClick={handleProjectUploaded}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded-lg text-sm transition-all"
            >
              Actualizar
            </button>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-gray-600">Cargando estatus...</span>
              </div>
            ) : userProjects.length === 0 ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No tienes proyectos aún</h4>
                <p className="text-gray-600">Una vez que subas tu proyecto, podrás ver su estatus aquí.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {userProjects.map((project, index) => (
                  <ProjectStatusBar 
                    key={index} 
                    project={project} 
                    user={user} 
                    onShowRejectReason={handleShowRejectReason}
                    onDeleteProject={handleDeleteProject}
                    onEditProject={handleEditProject}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contenido cuando no hay programas */}
        {programas.length === 0 ? null : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programas.map((programa) => (
              <div 
                key={programa.id}
                onClick={() => handleProgramaClick(programa.nombre)}
                className="relative bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
              >
                {/* Imagen de fondo */}
                <div className="relative h-64 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${programa.color} opacity-90`}></div>
                  
                  {/* Imagen de fondo simulada */}
                  <div className="absolute inset-0 bg-cover bg-center" 
                       style={{
                         backgroundImage: programa.id === 1 ? 
                           'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'50\' font-size=\'50\'%3E💻%3C/text%3E%3C/svg%3E")' :
                         programa.id === 2 ? 
                           'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'50\' font-size=\'50\'%3E📊%3C/text%3E%3C/svg%3E")' :
                         programa.id === 3 ? 
                           'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'50\' font-size=\'50\'%3E🧬%3C/text%3E%3C/svg%3E")' :
                         programa.id === 4 ? 
                           'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'50\' font-size=\'50\'%3E💰%3C/text%3E%3C/svg%3E")' :
                         programa.id === 5 ? 
                           'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'50\' font-size=\'50\'%3E🏥%3C/text%3E%3C/svg%3E")' :
                           'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'50\' font-size=\'50\'%3E🧪%3C/text%3E%3C/svg%3E")'
                       }}>
                  </div>

                  {/* Título sobre la imagen */}
                  <div className="absolute inset-0 flex items-end justify-start p-6">
                    <h3 className="text-white text-xl font-bold leading-tight drop-shadow-lg">
                      {programa.nombre}
                    </h3>
                  </div>

                  {/* Efecto hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para subir proyecto */}
      <UploadProject
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedPrograma('');
          setIsEditMode(false);
          setSelectedProject(null);
          // Recargar proyectos cuando se cierre el modal
          handleProjectUploaded();
        }}
        isEditMode={isEditMode}
        projectToEdit={selectedProject}
        programa={selectedPrograma}
      />

      {/* Modal para mostrar motivo de rechazo */}
      {showRejectModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Motivo del Rechazo</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Proyecto: {selectedProject.titulo}</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  {selectedProject.motivo_rechazo || selectedProject.comentarios || 'No se especificó un motivo de rechazo.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar eliminación de proyecto */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Eliminar Proyecto</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">¿Estás seguro que deseas eliminar este proyecto?</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Proyecto: <span className="font-medium">{selectedProject.titulo}</span>
              </p>
              <p className="text-sm text-gray-500">
                Esta acción no se puede deshacer. El proyecto será eliminado permanentemente.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteProject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar Proyecto
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Memorias;