import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User } from '../types';
import { authService } from '../services/authService';

// Creamos y exportamos el contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Cambiamos de arrow function a function declaration para mejor compatibilidad con HMR
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      // Agregar un pequeño delay para evitar problemas con recargas rápidas
      const timeoutId = setTimeout(() => {
        authService.verifyToken(token)
          .then(userData => {
            setUser(userData);
          })
          .catch((error) => {
            // Solo remover token si es un error de autenticación real
            if (error.response?.status === 401 || error.response?.status === 403) {
              sessionStorage.removeItem('token');
            }
            console.warn('Token verification failed:', error.message);
          })
          .finally(() => {
            setLoading(false);
          });
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credential: string) => {
    setLoading(true);
    try {
      // Usar Google OAuth
      const response = await authService.googleLogin(credential);
      
      setUser(response.user);
      sessionStorage.setItem('token', response.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('token');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Definimos y exportamos el hook en la misma declaración 
// para mejor compatibilidad con Fast Refresh de Vite
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}