import axios from 'axios';
import { User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configurar axios con CORS habilitado para autenticación
const authAPI = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000, // 10 segundos timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para manejo de errores con retry
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si es un error de red y no hemos reintentado
    if (error.code === 'ERR_NETWORK' && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Esperar un poco antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        return await authAPI(originalRequest);
      } catch (retryError: any) {
        console.error('API Error after retry:', retryError.response?.data || retryError.message);
        return Promise.reject(retryError);
      }
    }
    
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const authService = {
  // Login con Google OAuth
  async googleLogin(credential: string) {
    try {
      const response = await authAPI.post('/auth/google', { credential });
      
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },



  // Verificar token JWT
  async verifyToken(token: string): Promise<User> {
    try {
      const response = await authAPI.get('/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  },

  // Logout
  async logout(token: string) {
    try {
      const response = await authAPI.post('/auth/logout', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
};