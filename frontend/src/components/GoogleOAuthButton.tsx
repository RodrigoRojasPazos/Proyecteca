import React, { useEffect, useRef } from 'react';
import { useGoogleOAuth } from '../hooks/useGoogleOAuth';

interface GoogleOAuthButtonProps {
  onSuccess: (credential: string) => void;
  onError: (error: any) => void;
  disabled?: boolean;
  loading?: boolean;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onSuccess,
  onError
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const { renderGoogleButton, isGoogleLoaded } = useGoogleOAuth({
    clientId,
    onSuccess,
    onError
  });

  useEffect(() => {
    if (isGoogleLoaded && buttonRef.current && clientId) {
      // Limpiar el contenido anterior
      buttonRef.current.innerHTML = '';
      renderGoogleButton('google-signin-button');
    }
  }, [isGoogleLoaded, renderGoogleButton, clientId]);

  // Debug info para desarrollo
  useEffect(() => {
    if (clientId) {
      console.log(' Google OAuth configurado con Client ID:', clientId.substring(0, 12) + '...');
    } else {
      console.log(' Google OAuth no configurado. Por favor, configure VITE_GOOGLE_CLIENT_ID en el archivo .env');
    }
  }, [clientId]);

  // Si Google no está disponible o no hay client ID, mostrar error
  if (!isGoogleLoaded || !clientId) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="text-red-800 text-sm">
          <p className="font-medium">Google OAuth no configurado</p>
          <p className="mt-1">Por favor, configure VITE_GOOGLE_CLIENT_ID en el archivo .env</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        ref={buttonRef}
        id="google-signin-button"
        className="w-full"
      />
    </div>
  );
};

export default GoogleOAuthButton;