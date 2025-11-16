import React, { useState, useEffect } from 'react';
import { Edit2, ToggleLeft, ToggleRight, Search, UserPlus } from 'lucide-react';
import api from '../services/api';

interface Professor {
  id: number;
  nombre: string;
  email: string;
  matricula: string;
  isActive: boolean;
  createdAt: string;
}

interface ProfessorFormData {
  nombre: string;
  email: string;
  matricula: string;
}

const ProfessorsAdmin: React.FC = () => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<ProfessorFormData>({
    nombre: '',
    email: '',
    matricula: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfessors();
  }, []);

  const fetchProfessors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/professors');
      
      if (response.data.success) {
        setProfessors(response.data.data);
      } else {
        setError('Error al cargar profesores');
      }
    } catch (error: any) {
      console.error('Error fetching professors:', error);
      setError('Error al cargar profesores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nombre.trim() || !formData.email.trim() || !formData.matricula.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    try {
      let response;
      
      if (editingProfessor) {
        response = await api.put(`/professors/${editingProfessor.id}`, formData);
      } else {
        response = await api.post('/professors', formData);
      }

      if (response.data.success) {
        setSuccess(response.data.message);
        setFormData({ nombre: '', email: '', matricula: '' });
        setShowForm(false);
        setEditingProfessor(null);
        fetchProfessors();
      } else {
        setError(response.data.message || 'Error al procesar la solicitud');
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setError(error.response?.data?.message || 'Error al procesar la solicitud');
    }
  };

  const toggleProfessorStatus = async (professor: Professor) => {
    try {
      // Actualizar estado localmente primero para respuesta inmediata
      setProfessors(prev => prev.map(p => 
        p.id === professor.id 
          ? { ...p, isActive: !p.isActive }
          : p
      ));

      const response = await api.patch(`/professors/${professor.id}/toggle-status`);
      
      if (response.data.success) {
        setSuccess(response.data.message);
        // Refrescar desde el servidor para confirmar el cambio
        await fetchProfessors();
      } else {
        setError('Error al cambiar estado del profesor');
        // Revertir el cambio local si falló
        setProfessors(prev => prev.map(p => 
          p.id === professor.id 
            ? { ...p, isActive: professor.isActive }
            : p
        ));
      }
    } catch (error: any) {
      console.error('Error toggling professor status:', error);
      setError('Error al cambiar estado del profesor');
      // Revertir el cambio local si falló
      setProfessors(prev => prev.map(p => 
        p.id === professor.id 
          ? { ...p, isActive: professor.isActive }
          : p
      ));
    }
  };

  const startEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setFormData({
      nombre: professor.nombre,
      email: professor.email,
      matricula: professor.matricula
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingProfessor(null);
    setFormData({ nombre: '', email: '', matricula: '' });
    setShowForm(false);
    setError('');
  };

  const filteredProfessors = professors.filter(professor =>
    professor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.matricula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administración de Profesores/Asesores</h1>
              <p className="mt-2 text-gray-600">Gestiona los profesores asesores del sistema</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar profesores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">
                {editingProfessor ? 'Editar Profesor' : 'Agregar Nuevo Profesor'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Dr. Juan Pérez"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="profesor@universidad.edu"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    {editingProfessor ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Professors List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Profesores/Asesores ({filteredProfessors.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profesor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProfessors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No se encontraron profesores</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega el primer profesor al sistema'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProfessors.map((professor) => (
                    <tr key={professor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {professor.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {professor.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          professor.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {professor.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(professor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(professor)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleProfessorStatus(professor)}
                            className={`p-1 ${
                              professor.isActive 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={professor.isActive ? 'Desactivar' : 'Activar'}
                          >
                            {professor.isActive ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorsAdmin;