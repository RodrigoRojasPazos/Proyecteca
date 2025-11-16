import { useEffect, useCallback } from 'react';

interface GoogleUser {
  credential: string;
  select_by: string;
}

interface UseGoogleOAuthProps {
  clientId: string;
  onSuccess: (credential: string) => void;
  onError: (error: any) => void;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export const useGoogleOAuth = ({ clientId, onSuccess, onError }: UseGoogleOAuthProps) => {
  const initializeGoogleOAuth = useCallback(() => {
    if (window.google && clientId) {
      try {
        console.log('Inicializando Google OAuth');
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: GoogleUser) => {
            console.log('Google OAuth callback recibido');
            onSuccess(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          // Desactivamos estas opciones que pueden causar problemas en algunos navegadores
          use_fedcm_for_prompt: false,
          itp_support: true
        });
        console.log('Google OAuth inicializado correctamente');
      } catch (error) {
        console.error('Error al inicializar Google OAuth:', error);
        onError(error);
      }
    } else {
      console.warn('Cliente Google OAuth no disponible');
    }
  }, [clientId, onSuccess, onError]);

  const renderGoogleButton = useCallback((elementId: string) => {
    const buttonElement = document.getElementById(elementId);
    if (buttonElement && window.google) {
      window.google.accounts.id.renderButton(buttonElement, {
        theme: 'outline',
        size: 'large',
        width: 320, // Ancho en píxeles en lugar de porcentaje
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });
    }
  }, []);

  const signInWithPopup = useCallback(() => {
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      onError(new Error('Google OAuth no está disponible'));
    }
  }, [onError]);

  useEffect(() => {
    // Esperar a que el script de Google se cargue
    const checkGoogleLoaded = () => {
      if (window.google) {
        initializeGoogleOAuth();
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();
  }, [initializeGoogleOAuth]);

  return {
    renderGoogleButton,
    signInWithPopup,
    isGoogleLoaded: !!window.google
  };
};