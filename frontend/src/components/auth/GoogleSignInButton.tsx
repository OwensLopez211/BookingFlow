import React, { useEffect, useRef } from 'react';

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: Error) => void;
  text?: string;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  text = 'Continuar con Google',
  disabled = false
}) => {
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleGoogleSignIn = () => {
    console.log('🔐 GoogleSignInButton: Iniciando Google Sign-In');
    
    // Cargar el script de Google Identity Services si no está ya cargado
    if (!window.google) {
      console.log('🔐 GoogleSignInButton: Cargando script de Google');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('🔐 GoogleSignInButton: Script cargado, inicializando');
        setTimeout(initializeGoogleSignIn, 100);
      };
      script.onerror = (error) => {
        console.error('🔐 GoogleSignInButton: Error cargando script:', error);
        onError?.(new Error('Error cargando script de Google'));
      };
      document.head.appendChild(script);
    } else {
      console.log('🔐 GoogleSignInButton: Script ya cargado, inicializando');
      initializeGoogleSignIn();
    }
  };

  const initializeGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    console.log('🔐 GoogleSignInButton: Client ID:', clientId);
    
    if (!clientId) {
      console.error('Google Client ID no está configurado');
      onError?.(new Error('Google Client ID no está configurado'));
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          console.log('🔐 GoogleSignInButton: Respuesta recibida:', response);
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError?.(new Error('No se recibió credencial de Google'));
          }
        },
        use_fedcm_for_prompt: false,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Intentar mostrar el popup primero
      window.google.accounts.id.prompt((notification: any) => {
        console.log('🔐 GoogleSignInButton: Notification:', notification);
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Si el popup no se muestra, renderizar un botón como fallback
          console.log('🔐 GoogleSignInButton: Popup no mostrado, usando botón');
          if (googleButtonRef.current) {
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              width: '100%'
            });
          }
        }
      });
    } catch (error) {
      console.error('🔐 GoogleSignInButton: Error inicializando:', error);
      onError?.(new Error('Error inicializando Google Sign-In'));
    }
  };

  return (
    <>
      {/* Botón personalizado */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={disabled}
        className={`
          w-full relative flex items-center justify-center px-6 py-3.5 bg-white hover:bg-gray-50 
          text-gray-800 font-semibold rounded-lg border border-gray-200 shadow-sm hover:shadow-md 
          transition-all duration-200 group overflow-hidden focus:outline-none focus:ring-2 
          focus:ring-offset-2 focus:ring-blue-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Efecto de resplandor sutil */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-red-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <svg
          className="w-5 h-5 mr-3 flex-shrink-0 relative z-10"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span className="relative z-10">{text}</span>
        
        {/* Efecto de hover en el icono */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 transition-opacity duration-300"></div>
      </button>
      
      {/* Contenedor para el botón de Google (fallback) */}
      <div ref={googleButtonRef} className="hidden w-full mt-2"></div>
    </>
  );
};

