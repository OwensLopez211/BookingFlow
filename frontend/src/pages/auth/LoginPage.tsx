import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAuthStore } from '@/stores/authStore';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services/authService';

interface LoginPageProps {
  heroVariants?: any;
  formVariants?: any;
  decorativeVariants?: any;
}

export const LoginPage: React.FC<LoginPageProps> = ({ heroVariants, formVariants, decorativeVariants }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();
  const { showError } = useToast(); // Solo usamos showError para errores de autenticación
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Initialize Google Sign-In when component mounts
  useEffect(() => {
    console.log('🔐 LoginPage mounted, checking for Google script');
    
    // Wait a bit for the script to load if it's still loading
    const checkGoogleAndInit = () => {
      if (window.google) {
        console.log('🔐 Google script detected, initializing...');
        initializeGoogleSignIn();
      } else {
        console.log('🔐 Google script not ready yet, will try with manual click');
      }
    };
    
    // Try immediately
    checkGoogleAndInit();
    
    // Also try after a delay in case the script is still loading
    const timer = setTimeout(checkGoogleAndInit, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      // No usar toast para validación de campos, los errores se muestran inline
      return false;
    }
    
    if (isLoading) {
      return false; // Prevenir múltiples submissions
    }
    
    try {
      const success = await login(formData);
      if (success) {
        navigate(from, { replace: true });
      } else {
        // Solo usar nuestro toast personalizado para errores de login
        showError(
          'Error de autenticación',
          'Email o contraseña incorrectos'
        );
      }
    } catch (error) {
      // Solo usar nuestro toast personalizado para errores de login
      showError(
        'Error de autenticación',
        'Verifica tu email y contraseña e intenta nuevamente'
      );
    }
    
    return false;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleGoogleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔐 Iniciando proceso de Google Login');
    
    // Cargar el script de Google Identity Services si no está ya cargado
    if (!window.google) {
      console.log('🔐 Cargando script de Google Identity Services');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('🔐 Script de Google cargado exitosamente');
        // Esperar un poco para que Google se inicialice
        setTimeout(initializeGoogleSignIn, 100);
      };
      script.onerror = (error) => {
        console.error('🔐 Error cargando script de Google:', error);
        showError('Error de red', 'No se pudo cargar el script de Google. Verifica tu conexión a internet.');
      };
      document.head.appendChild(script);
    } else {
      console.log('🔐 Script de Google ya está cargado');
      initializeGoogleSignIn();
    }
  };

  const initializeGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    console.log('🔐 Inicializando Google Sign-In con Client ID:', clientId);
    
    if (!clientId) {
      console.error('Google Client ID no está configurado');
      showError('Error de configuración', 'Google Client ID no está configurado');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          console.log('🔐 Respuesta de Google recibida:', response);
          if (response.credential) {
            await handleGoogleCallback(response.credential);
          } else {
            showError('Error de autenticación', 'No se recibió credencial de Google');
          }
        },
        use_fedcm_for_prompt: false,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Intentar renderizar el botón oficial de Google
      const googleButtonContainer = document.getElementById('google-signin-button');
      if (googleButtonContainer) {
        console.log('🔐 Renderizando botón oficial de Google');
        
        try {
          window.google.accounts.id.renderButton(googleButtonContainer, {
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            width: '100%'
          });
          
          // Si el botón se renderiza correctamente, ocultar el botón personalizado
          const customButton = googleButtonContainer.nextElementSibling;
          if (customButton) {
            (customButton as HTMLElement).style.display = 'none';
          }
          
          console.log('✅ Botón oficial de Google renderizado exitosamente');
          return;
        } catch (renderError) {
          console.log('🔐 Error renderizando botón oficial:', renderError);
        }
      }

      // Si el botón oficial no funciona, intentar popup como fallback
      console.log('🔐 Intentando popup de Google como fallback');
      window.google.accounts.id.prompt((notification: any) => {
        console.log('🔐 Google prompt notification:', notification);
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('🔐 Popup también bloqueado, usar botón personalizado');
          // El botón personalizado quedará visible para que el usuario pueda hacer click
        }
      });

    } catch (error) {
      console.error('🔐 Error inicializando Google Sign-In:', error);
      showError('Error de configuración', 'Error inicializando Google Sign-In');
    }
  };

  const handleGoogleCallback = async (credential: string) => {
    try {
      console.log('🔐 Procesando autenticación con Google...');
      
      const success = await useAuthStore.getState().googleAuth(credential);
      
      if (success) {
        console.log('✅ Autenticación con Google exitosa');
        navigate(from, { replace: true });
      }
      // Los errores ya son manejados por el store con toasts
    } catch (error: any) {
      console.error('❌ Error en autenticación con Google:', error);
      showError('Error de autenticación', 'Error durante la autenticación con Google');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      {/* Hero Section - Desktop Only */}
      <motion.div 
        variants={heroVariants}
        className="hidden lg:block fixed inset-y-0 left-0 w-1/2 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 overflow-hidden">
        <div className="flex flex-col justify-center h-full px-12 xl:px-16 relative">
          <div className="max-w-md relative z-10">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <img src="/bookingflowlogo.png" alt="BookFlow" className="w-8 h-8" />
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">BookFlow</span>
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Gestiona tus citas de manera
              <span className="bg-gradient-to-r from-emerald-200 to-white bg-clip-text text-transparent block"> inteligente</span>
            </h1>
            
            <p className="text-emerald-100 text-lg leading-relaxed mb-8">
              La plataforma todo-en-uno para profesionales que buscan optimizar su tiempo y mejorar la experiencia de sus clientes.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-emerald-100">
                <div className="w-2 h-2 bg-emerald-300 rounded-full"></div>
                <span>Calendario inteligente con sincronización automática</span>
              </div>
              <div className="flex items-center space-x-3 text-emerald-100">
                <div className="w-2 h-2 bg-emerald-300 rounded-full"></div>
                <span>Recordatorios automáticos Email (SMS Proximamente)</span>
              </div>
              <div className="flex items-center space-x-3 text-emerald-100">
                <div className="w-2 h-2 bg-emerald-300 rounded-full"></div>
                <span>Analytics detallados de tu negocio</span>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <motion.div 
            variants={decorativeVariants}
            className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"
          ></motion.div>
          <motion.div 
            variants={decorativeVariants}
            className="absolute bottom-32 right-32 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl"
          ></motion.div>
          <motion.div 
            variants={decorativeVariants}
            className="absolute top-1/2 right-10 w-32 h-32 bg-teal-300/10 rounded-full blur-xl"
          ></motion.div>
          <motion.div 
            variants={decorativeVariants}
            className="absolute bottom-10 left-10 w-20 h-20 bg-cyan-300/10 rounded-full blur-lg"
          ></motion.div>
          <motion.div 
            variants={decorativeVariants}
            className="absolute top-32 left-32 w-16 h-16 bg-emerald-300/5 rounded-full blur-md"
          ></motion.div>
        </div>
      </motion.div>

      {/* Login Form */}
      <motion.div 
        variants={formVariants}
        className="lg:ml-[50%] flex min-h-screen">
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-12 xl:px-16 py-8 lg:py-12 min-h-screen lg:min-h-0">
          <div className="mx-auto w-full max-w-sm lg:max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
                  <img src="/bookingflowlogo.png" alt="BookFlow" className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">BookFlow</span>
              </div>
            </div>

            {/* Header */}
            <div className="text-center lg:text-left mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Bienvenido de vuelta
              </h2>
              <p className="text-gray-300 text-base">
                Inicia sesión en tu cuenta para continuar
              </p>
            </div>

            {/* Google Button - Container que será reemplazado por Google */}
            <div id="google-signin-button"></div>
            
            {/* Botón fallback personalizado */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full relative flex items-center justify-center px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 mb-6 group overflow-hidden"
            >
              {/* Efecto de resplandor sutil */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-red-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <svg className="w-5 h-5 mr-3 flex-shrink-0 relative z-10" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="relative z-10 font-semibold">Continuar con Google</span>
              
              {/* Efecto de hover en el icono */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 transition-opacity duration-300"></div>
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900 text-gray-400 font-semibold">O continúa con email</span>
              </div>
            </div>

            {/* Form */}
            <form 
              onSubmit={handleSubmit} 
              className="space-y-4"
              noValidate
            >
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-800 placeholder-gray-400 text-white ${
                    errors.email ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-1"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-800 placeholder-gray-400 text-white ${
                      errors.password ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-1"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 bg-gray-800 border-gray-600 rounded focus:ring-emerald-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-300">Recordarme</span>
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-400">
                ¿No tienes una cuenta?{' '}
                <Link
                  to="/auth/register"
                  className="font-semibold text-emerald-400 hover:text-emerald-300 transition-all duration-300 hover:underline underline-offset-4"
                >
                  Regístrate gratis
                </Link>
              </p>
            </div>
            
            {/* Quick Switch Button */}
            <div className="mt-6 text-center">
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-400 bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800 hover:text-white hover:border-emerald-500 transition-all duration-300 group"
              >
                <motion.span
                  whileHover={{ x: -5 }}
                  transition={{ duration: 0.2 }}
                  className="mr-2"
                >
                  ←
                </motion.span>
                Cambiar a Registro
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

