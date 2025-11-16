import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { usersAPI, projectsAPI, policyAPI } from '../services/api';
import { User, AccessException } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Search, Users, Edit, Trash2, UserCheck, UserX, UserPlus, GraduationCap } from 'lucide-react';
import ProfessorsAdmin from './ProfessorsAdmin';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'professors'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [stats, setStats] = useState<any>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  // Excepciones manuales discretas
  const { user: currentUser } = useAuth();
  const [exceptions, setExceptions] = useState<AccessException[]>([]);
  const [newExceptionEmail, setNewExceptionEmail] = useState<string>('');
  const [bulkExceptionsText, setBulkExceptionsText] = useState<string>('');
  const [exceptionsOpen, setExceptionsOpen] = useState<boolean>(false);
  const [exceptionsLoading, setExceptionsLoading] = useState<boolean>(false);
  const [exceptionsError, setExceptionsError] = useState<string>('');

  // Función para extraer matrícula del correo electrónico
  const extraerMatriculaDeEmail = (email: string): string => {
    // Buscar números al inicio del email antes del @
    const match = email.match(/^(\d+)@/);
    return match ? match[1] : '';
  };

  useEffect(() => {
    loadUsers();
    loadStats();
    // Ya no se carga política editable
  }, [search, roleFilter]);

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (showEditModal || showDeleteModal) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        if (showEditModal) setIsModalVisible(true);
        if (showDeleteModal) setIsDeleteModalVisible(true);
      }, 10);
    } else {
      setIsModalVisible(false);
      setIsDeleteModalVisible(false);
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showEditModal, showDeleteModal]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params: any = { limit: 1000 }; // Cargar todos los usuarios
      if (search) params.search = search;
      if (roleFilter !== 'todos') params.rol = roleFilter;
      
      const response = await usersAPI.getAll(params);
      
      if (response && response.users) {
        console.log('Usuarios cargados:', response.users); // Para debug
        setUsers(response.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [userStats, projectStats] = await Promise.all([
        usersAPI.getStats(),
        projectsAPI.getStats()
      ]);
      
      setStats({
        ...userStats.data,
        ...projectStats.data
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadExceptions = async () => {
    try {
      setExceptionsLoading(true);
      setExceptionsError('');
      const exResp = await policyAPI.listExceptions();
      if (exResp?.data) setExceptions(exResp.data);
    } catch (error: any) {
      setExceptionsError('No se pudo cargar las excepciones');
    } finally {
      setExceptionsLoading(false);
    }
  };

  const toggleExceptions = async () => {
    const willOpen = !exceptionsOpen;
    setExceptionsOpen(willOpen);
    if (willOpen) await loadExceptions();
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExceptionEmail.trim()) return;
    try {
      const resp = await policyAPI.addException(newExceptionEmail.trim());
      if (resp?.success) {
        setExceptions(prev => [...prev, resp.data]);
        setNewExceptionEmail('');
      } else {
        alert(resp?.message || 'No se pudo agregar');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al agregar excepción');
    }
  };

  const handleBulkAddExceptions = async () => {
    const emails = bulkExceptionsText
      .split(/\r?\n|,|;|\s+/)
      .map(s => s.trim())
      .filter(s => s.includes('@'));
    if (emails.length === 0) return;
    try {
      const resp = await policyAPI.addExceptionsBulk(emails);
      if (resp?.success) {
        // Refrescar lista
        const exResp = await policyAPI.listExceptions();
        setExceptions(exResp.data || []);
        setBulkExceptionsText('');
      }
    } catch (err: any) {
      alert('Error en carga masiva');
    }
  };

  const handleRemoveException = async (id: number) => {
    if (!confirm('¿Eliminar esta excepción?')) return;
    try {
      const resp = await policyAPI.removeException(id);
      if (resp?.success) {
        setExceptions(prev => prev.filter(e => e.id !== id));
      }
    } catch (err: any) {
      alert('Error eliminando excepción');
    }
  };

  const handleRoleChange = async (user: User, newRole: 'alumno' | 'profesor' | 'director') => {
    try {
      await usersAPI.updateRole(user.id_usuario, newRole);
      
      // Actualizar usuario en la lista local
      const updatedUsers = users.map(u => 
        u.id_usuario === user.id_usuario ? { ...u, rol: newRole } : u
      );
      setUsers(updatedUsers);
      
      closeEditModal();
      loadStats(); // Recargar estadísticas
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error al actualizar el rol del usuario');
    }
  };

  

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.rol);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setIsModalVisible(false);
    setTimeout(() => {
      setShowEditModal(false);
      setSelectedUser(null);
    }, 500);
  };

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case 'director':
        return 'bg-purple-100 text-purple-800';
      case 'profesor':
        return 'bg-blue-100 text-blue-800';
      case 'asesor':
        return 'bg-blue-100 text-blue-800';
      case 'alumno':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (rol: string) => {
    switch (rol) {
      case 'director':
        return 'Director';
      case 'profesor':
        return 'Profesor';
      case 'asesor':
        return 'Asesor';
      case 'alumno':
        return 'Alumno';
      default:
        return rol;
    }
  };

  // Abrir modal de eliminación
  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Cerrar modal de eliminación
  const closeDeleteModal = () => {
    setIsDeleteModalVisible(false);
    setTimeout(() => {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }, 500);
  };

  // Eliminar usuario
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await usersAPI.delete(userToDelete.id_usuario);
      setUsers(users.filter(u => u.id_usuario !== userToDelete.id_usuario));
      loadStats();
      closeDeleteModal();
      alert('Usuario eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      const errorMessage = error.response?.data?.message || 'Error al eliminar usuario';
      alert(errorMessage);
    }
  };

  return (
    <>
      <Layout title="Administración">
        <div className="space-y-6">
  {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alumnos</p>
                <p className="text-2xl font-bold text-green-600">{stats.alumnos || 0}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profesores/Asesores</p>
                <p className="text-2xl font-bold text-purple-600">{(stats.profesores || 0) + (stats.asesores || 0)}</p>
              </div>
              <UserX className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Directores</p>
                <p className="text-2xl font-bold text-orange-600">{stats.directores || 0}</p>
              </div>
              <UserPlus className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Excepciones manuales discretas (solo Director) */}
        {currentUser?.rol === 'director' && (
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Opciones administrativas</h2>
              <button
                onClick={toggleExceptions}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
                aria-expanded={exceptionsOpen}
                aria-controls="exceptions-panel"
              >
                {exceptionsOpen ? 'Ocultar excepciones' : 'Excepciones manuales'}
              </button>
            </div>
            {exceptionsOpen && (
            <div id="exceptions-panel" className="mt-4">
              {exceptionsError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                  {exceptionsError}
                </div>
              )}
              {exceptionsLoading ? (
                <div className="text-sm text-gray-500">Cargando excepciones...</div>
              ) : (
              <>
              <h3 className="text-lg font-semibold mb-3">Excepciones manuales por correo</h3>
              <p className="text-sm text-gray-600 mb-4">Solo los correos agregados aquí se permitirán como excepción a la regla del año mínimo. El dominio institucional sigue siendo obligatorio.</p>
              <div className="grid md:grid-cols-2 gap-6">
                <form onSubmit={handleAddException} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Agregar un correo</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newExceptionEmail}
                      onChange={(e) => setNewExceptionEmail(e.target.value)}
                      placeholder="2022xxxx@upqroo.edu.mx"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Correo para excepción"
                      required
                    />
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Agregar</button>
                  </div>
                </form>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Carga masiva (pegue lista, separada por saltos de línea, coma o espacio)</label>
                  <textarea
                    value={bulkExceptionsText}
                    onChange={(e) => setBulkExceptionsText(e.target.value)}
                    rows={3}
                    placeholder={"2022a001@upqroo.edu.mx\n2022a002@upqroo.edu.mx"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Lista de correos para carga masiva"
                  />
                  <button onClick={handleBulkAddExceptions} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Agregar lista</button>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-medium mb-2">Correos con excepción</h4>
                {exceptions.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay excepciones registradas.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {exceptions.map(ex => (
                          <tr key={ex.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{ex.email}</td>
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => handleRemoveException(ex.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Quitar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              </>
              )}
            </div>
            )}
          </div>
        )}

        {/* Pestañas de Navegación */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Gestión de Usuarios
              </button>
              <button
                onClick={() => setActiveTab('professors')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'professors'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <GraduationCap className="w-4 h-4 inline mr-2" />
                Gestión de Profesores/Asesores
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Filtros */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por correo, nombre o matrícula..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los roles</option>
                <option value="alumno">Alumnos</option>
                <option value="profesor">Profesores</option>
                <option value="director">Directores</option>
              </select>
            </div>

            {/* Lista de usuarios */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-2 text-gray-600">Cargando usuarios...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search || roleFilter !== 'todos' 
                    ? "No se encontraron usuarios con los filtros aplicados."
                    : "Aún no hay usuarios registrados en el sistema."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Matrícula
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Registro
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id_usuario} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.avatar ? (
                                <img 
                                  src={user.avatar} 
                                  alt={user.nombre}
                                  className="h-10 w-10 rounded-full object-cover"
                                  onError={(e) => {
                                    // Si la imagen falla, mostrar el fallback con inicial
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    if (target.nextElementSibling) {
                                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div 
                                className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center"
                                style={{ display: user.avatar ? 'none' : 'flex' }}
                              >
                                <span className="text-white font-medium text-sm">
                                  {user.nombre?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email || user.correo}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.rol)}`}>
                            {getRoleText(user.rol)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.matricula || extraerMatriculaDeEmail(user.email || user.correo || '') || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.creado_en).toLocaleDateString()}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Tab de Profesores */}
        {activeTab === 'professors' && (
          <ProfessorsAdmin />
        )}
      </div>
    </Layout>

    {/* Modal de edición de rol */}
    {showEditModal && selectedUser && (
      <div 
        className={`fixed inset-0 bg-gray-600 overflow-y-auto h-full w-full z-[9999] flex items-center justify-center transition-opacity duration-500 ${
          isModalVisible ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={closeEditModal}
      >
        <div 
          className={`relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white transform transition-all duration-500 ${
            isModalVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cambiar Rol de Usuario
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Usuario: <strong>{selectedUser.nombre}</strong></p>
              <p className="text-sm text-gray-600">Correo: <strong>{selectedUser.email || selectedUser.correo}</strong></p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuevo Rol
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="alumno">Alumno</option>
                <option value="profesor">Profesor</option>
                <option value="asesor">Asesor</option>
                <option value="director">Director</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRoleChange(selectedUser, newRole as any)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Modal de confirmación de eliminación */}
    {showDeleteModal && userToDelete && (
      <div 
        className={`fixed inset-0 bg-gray-600 overflow-y-auto h-full w-full z-[9999] flex items-center justify-center transition-opacity duration-500 ${
          isDeleteModalVisible ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={closeDeleteModal}
      >
        <div 
          className={`relative mx-auto p-6 border w-96 shadow-lg rounded-md bg-white transform transition-all duration-500 ${
            isDeleteModalVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Eliminar Usuario
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                ¿Estás seguro de que deseas eliminar a:
              </p>
              <p className="text-sm font-semibold text-gray-900">{userToDelete.nombre}</p>
              <p className="text-sm text-gray-600">{userToDelete.email || userToDelete.correo}</p>
              <p className="text-sm text-red-600 mt-3 font-medium">
                Esta acción no se puede deshacer
              </p>
            </div>
            <div className="flex justify-center space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Admin;