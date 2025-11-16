import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de proyectos
export const projectsAPI = {
  // Obtener todos los proyectos
  getAll: async () => {
    const response = await api.get('/projects');
    return response.data;
  },

  // Obtener un proyecto específico por ID
  getById: async (id: number) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Crear un nuevo proyecto
  create: async (projectData: any) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  // Crear un nuevo proyecto con archivo
  createWithFile: async (projectData: any, file?: File) => {
    const formData = new FormData();
    
    // Agregar todos los campos del proyecto
    Object.keys(projectData).forEach(key => {
      if (projectData[key] !== null && projectData[key] !== undefined) {
        if (typeof projectData[key] === 'object') {
          formData.append(key, JSON.stringify(projectData[key]));
        } else {
          formData.append(key, projectData[key]);
        }
      }
    });
    
    // Agregar el archivo si existe
    if (file) {
      formData.append('file', file);
    }
    
    const response = await api.post('/projects', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Actualizar un proyecto
  update: async (id: number, projectData: any) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Actualizar un proyecto con archivo
  updateWithFile: async (id: number, projectData: any, file?: File) => {
    const formData = new FormData();
    
    // Agregar todos los campos del proyecto
    Object.keys(projectData).forEach(key => {
      if (projectData[key] !== null && projectData[key] !== undefined) {
        if (typeof projectData[key] === 'object') {
          formData.append(key, JSON.stringify(projectData[key]));
        } else {
          formData.append(key, projectData[key]);
        }
      }
    });
    
    // Agregar el archivo si existe
    if (file) {
      formData.append('file', file);
    }
    
    const response = await api.put(`/projects/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Eliminar un proyecto
  delete: async (id: number) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // Obtener estadísticas de proyectos
  getStats: async () => {
    try {
      const response = await api.get('/projects/stats');
      return response.data;
    } catch (error) {
      // Fallback si no existe el endpoint
      console.warn('Stats endpoint not available, returning default stats');
      return { data: { proyectos_activos: 0, proyectos_completados: 0 } };
    }
  }
};

// Servicios de usuarios
export const usersAPI = {
  // Obtener todos los usuarios
  getAll: async (params?: { search?: string; rol?: string; limit?: number; page?: number }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Obtener un usuario por ID
  getById: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Crear un nuevo usuario
  create: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Actualizar un usuario
  update: async (id: number, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Eliminar un usuario
  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Cambiar rol de usuario
  updateRole: async (id: number, rol: 'alumno' | 'profesor' | 'director') => {
    const response = await api.put(`/users/${id}/role`, { rol });
    return response.data;
  },
 

  // Obtener estadísticas de usuarios
  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  }
};

// Servicios de autenticación
export const authAPI = {
  // Login con Google OAuth
  googleLogin: async (token: string) => {
    const response = await api.post('/auth/google', { token });
    return response.data;
  },

  // Obtener perfil del usuario
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// Política de acceso (solo director)
export const policyAPI = {
  getAccessPolicy: async () => {
    const response = await api.get('/policy/access-policy');
    return response.data;
  },
  updateAccessPolicy: async (data: { minAlumnoYear: number; extraAllowedYears: number[] }) => {
    const response = await api.put('/policy/access-policy', data);
    return response.data;
  },
  // Excepciones manuales
  listExceptions: async () => {
    const response = await api.get('/policy/access-exceptions');
    return response.data;
  },
  addException: async (email: string, note?: string) => {
    const response = await api.post('/policy/access-exceptions', { email, note });
    return response.data;
  },
  addExceptionsBulk: async (emails: string[]) => {
    const response = await api.post('/policy/access-exceptions/bulk', { emails });
    return response.data;
  },
  removeException: async (id: number) => {
    const response = await api.delete(`/policy/access-exceptions/${id}`);
    return response.data;
  }
};

export default api;