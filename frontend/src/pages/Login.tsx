import React, { useEffect, useState } from 'react';
import { FaGraduationCap } from "react-icons/fa";
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import GoogleOAuthButton from '../components/GoogleOAuthButton';

const Login: React.FC = () => {
  const { user, login, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Activar la animación después de un pequeño delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Verificar redirección después de todos los hooks
  if (user) {
    // Redirigir según el rol
    let redirectPath = '/inicio';
    if (user.rol === 'director') redirectPath = '/admin';
    else if (user.rol === 'profesor' || user.rol === 'asesor') redirectPath = '/revisiones';
    return <Navigate to={redirectPath} replace />;
  }

  const handleGoogleSuccess = async (credential: string) => {
    try {
      await login(credential);
      // La redirección se manejará automáticamente por el Navigate en el render
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  const handleGoogleError = (error: any) => {
    console.error('Google OAuth error:', error);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#4C0000' }}>
      {/* Fondo sólido con el color rojo oscuro */}

      {/* Contenedor principal centrado */}
      <div className="relative z-20 w-full flex items-center justify-center p-4 sm:p-6 md:p-8 py-8 md:py-12 xl:py-20">
        {/* Contenedor para logo y tarjeta con animación sincronizada */}
        <div 
          className={`flex flex-col items-center gap-6 md:gap-8 xl:flex-row xl:gap-24 2xl:gap-32 w-full max-w-6xl transform transition-all duration-1000 ease-out ${
            isVisible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-12 opacity-0 scale-95'
          }`}
        >
          {/* Logo más grande arriba en móvil/tablet, a la izquierda en desktop */}
          <div className="flex-shrink-0">
            <img 
              src="/assets/2UPQROO-logo.png" 
              alt="Universidad Politécnica de Quintana Roo" 
              className="h-20 sm:h-24 md:h-28 xl:h-28 w-auto filter brightness-0 invert"
            />
          </div>

          {/* Caja de login */}
          <div className="w-full max-w-md xl:ml-auto xl:mr-20">
          <div className="relative w-full">
            {/* Tarjeta principal sin efecto glow */}
            <div 
              className="backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 border"
              style={{ 
                backgroundColor: 'rgba(250, 250, 250, 0.95)',
                borderColor: 'rgba(255, 100, 0, 0.3)'
              }}
            >
              {/* Encabezado elegante sin logo */}
              <div className="text-center mb-8 md:mb-10">
                <h1 
                  className="text-xl sm:text-2xl font-bold mb-3 md:mb-4 leading-tight"
                  style={{ color: '#4C0000' }}
                >
                  Plataforma Académica
                </h1>
                <h2 
                  className="text-base sm:text-lg font-semibold mb-2 md:mb-3"
                  style={{ color: '#FF6400' }}
                >
                  Estancias & Servicio Social
                </h2>
                <p className="text-xs sm:text-sm opacity-75 mb-3 md:mb-4 px-2" style={{ color: '#4C0000' }}>
                  Acceso exclusivo para estudiantes y profesores
                </p>
              </div>

              {/* Sección de login */}
              <div className="space-y-5 md:space-y-6">
                <div className="text-center">
                  <div className="text-3xl mb-2 md:mb-3">
                    {/* Icono de birrete alineado a la izquierda */}
                    <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                        <FaGraduationCap size={40} color="#4C0000" />
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium mb-4 md:mb-6 px-2" style={{ color: '#4C0000' }}>
                    Ingresa con tu cuenta institucional
                  </p>
                </div>

                {/* Botón de Google con efecto de profundidad */}
                <div className="flex justify-center w-full">
                  <div className="relative group">
                    {/* Sombra de profundidad */}
                    <div 
                      className="absolute inset-0 rounded-lg transform translate-y-1 group-hover:translate-y-0 transition-transform duration-200"
                      style={{ backgroundColor: 'rgba(76, 0, 0, 0.3)' }}
                    ></div>
                    
                    {/* Botón principal con elevación */}
                    <div className="relative transform group-hover:-translate-y-0.5 transition-transform duration-200 shadow-lg hover:shadow-xl">
                      <GoogleOAuthButton
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        loading={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer de la tarjeta */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-xs opacity-60" style={{ color: '#4C0000' }}>
                    ¿Problemas para acceder?{' '}
                    <button 
                      className="font-semibold underline hover:no-underline transition"
                      style={{ color: '#FF6400' }}
                    >
                      Contactar Soporte
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Elementos decorativos adicionales */}
      <div className="hidden sm:flex absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 justify-between items-end pointer-events-none opacity-30">
        <div className="flex space-x-1 sm:space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 sm:w-2 rounded-full"
              style={{ 
                backgroundColor: '#FAFAFA',
                height: `${(i + 1) * 15}px`
              }}
            />
          ))}
        </div>
        <div className="flex space-x-1 sm:space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 sm:w-2 rounded-full"
              style={{ 
                backgroundColor: '#FAFAFA',
                height: `${(3 - i) * 15}px`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;