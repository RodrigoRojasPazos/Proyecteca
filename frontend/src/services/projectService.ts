import { Project } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener proyectos');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching projects from API:', error);
      throw error;
    }
  },

  async createProject(projectData: Omit<Project, 'id_proyecto' | 'creado_en'>): Promise<Project> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error('Error al crear proyecto');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar proyecto');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  async deleteProject(id: number): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar proyecto');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  async getProjectStats() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/projects/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas de proyectos');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching project stats:', error);
      throw error;
    }
  }
};