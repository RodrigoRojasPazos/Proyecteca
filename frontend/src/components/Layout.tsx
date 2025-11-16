import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaBars, FaTimes } from 'react-icons/fa';

interface NavItem {
  path: string;
  label: string;
  requiresRole?: 'alumno' | 'profesor' | 'director' | 'asesor';
  allowedRoles?: ('alumno' | 'profesor' | 'director' | 'asesor')[];
}

const Layout: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileMenuClosing, setIsProfileMenuClosing] = useState(false);

  // Animación más suave cuando cambia la ruta
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 350);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleCloseProfileMenu = () => {
    setIsProfileMenuClosing(true);
    setTimeout(() => {
      setIsProfileMenuOpen(false);
      setIsProfileMenuClosing(false);
    }, 150);
  };

  const navItems: NavItem[] = [
  // { path: '/dashboard', label: 'Dashboard' },
    { path: '/inicio', label: 'Mis Proyectos', allowedRoles: ['alumno'] },
    { path: '/proyectos', label: 'Proyectos UPQROO' },
    { path: '/revisiones', label: 'Revisiones', allowedRoles: ['profesor', 'director', 'asesor'] },
    { path: '/admin', label: 'Administración', requiresRole: 'director' }
  ];

  const filteredNavItems = navItems.filter(item => {
    // Si no hay restricciones de rol, mostrar el item
    if (!item.requiresRole && !item.allowedRoles) return true;
    
    // Verificar rol requerido específico
    if (item.requiresRole && user?.rol === item.requiresRole) return true;
    
    // Verificar roles permitidos
    if (item.allowedRoles && user?.rol && item.allowedRoles.includes(user.rol)) return true;
    
    // Si no cumple ninguna condición, no mostrar
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            {/* Logo y título */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center justify-center w-24 h-8 sm:w-36 sm:h-11 md:w-44 md:h-14">
                <img 
                  src="/assets/2UPQROO-logo.png" 
                  alt="Universidad Politécnica de Quintana Roo" 
                  className="object-contain w-full h-full"
                  onError={(e) => {
                    // Fallback si la imagen no se encuentra
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.logo-fallback') as HTMLDivElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                {/* Fallback logo */}
                <div className="logo-fallback bg-orange-500 rounded-lg items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-base sm:text-xl md:text-2xl">UPQ</span>
                </div>
              </div>
              <div className="text-white hidden sm:block">
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold">{title}</h2>
              </div>
            </div>

            {/* Usuario */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-white text-right hidden md:block">
                <div className="font-semibold">
                  Bienvenido, {user?.nombre || 'Usuario'}
                </div>
                <div className="text-sm opacity-90">
                  {user?.email || 'usuario@upg.edu.mx'}
                </div>
              </div>
              <div className="relative group">
                <img 
                  className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full border-2 border-white cursor-pointer hover:border-orange-200 transition-colors" 
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nombre || 'Usuario')}&background=ffffff&color=f97316&size=48`} 
                  alt={user?.nombre || 'Usuario'}
                  title="Menú de usuario"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                />
                
                {/* Menú desplegable con animación */}
                {isProfileMenuOpen && (
                  <>
                    {/* Overlay para cerrar al hacer click fuera */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={handleCloseProfileMenu}
                    />
                    
                    {/* Menú */}
                    <div className={`absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg z-20 overflow-hidden transition-all duration-150 ease-out ${
                      isProfileMenuClosing 
                        ? 'opacity-0 -translate-y-2' 
                        : 'opacity-100 translate-y-0 animate-[slideDown_0.15s_ease-out]'
                    }`}>
                      <style>{`
                        @keyframes slideDown {
                          from {
                            opacity: 0;
                            transform: translateY(-8px);
                          }
                          to {
                            opacity: 1;
                            transform: translateY(0);
                          }
                        }
                      `}</style>
                      <button
                        onClick={() => {
                          handleCloseProfileMenu();
                          setTimeout(() => logout(), 150);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-700 font-medium transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              {/* Botón menú móvil */}
              <button
                className="md:hidden text-white p-2 hover:bg-orange-600 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación Desktop */}
      <nav className="hidden md:block bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 lg:space-x-8">
            {filteredNavItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`relative group ${
                  location.pathname === item.path
                    ? 'text-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                } py-4 px-1 text-sm font-medium transition-all duration-300 ease-out transform hover:scale-105`}
              >
                {item.label}
                {/* Indicador animado */}
                <div 
                  className={`absolute bottom-0 left-0 h-0.5 bg-orange-500 transition-all duration-300 ease-out ${
                    location.pathname === item.path 
                      ? 'w-full' 
                      : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Navegación Móvil */}
      <nav className={`md:hidden bg-white border-b transition-all duration-300 ease-in-out ${
        isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="px-4 py-2 space-y-1">
          {filteredNavItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Contenido con animación simple que no interfiere con modales */}
      <main className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        <div
          className={`transition-opacity duration-700 ease-in-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;