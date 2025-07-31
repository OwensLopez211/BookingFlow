import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';


export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    const success = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      organizationName: 'Mi Empresa', // Temporal, se configurará en onboarding
      templateType: 'custom', // Temporal, se configurará en onboarding
    });

    if (success) {
      navigate('/onboarding');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoogleSignup = () => {
    console.log('Google signup será implementado próximamente');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section - Desktop Only */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        <div className="flex flex-col justify-center h-full px-12 xl:px-16 relative">
          <div className="max-w-md relative z-10">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <img src="/bookingflowlogo.png" alt="BookFlow" className="w-8 h-8" />
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">BookFlow</span>
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Comienza tu
              <span className="bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent"> transformación digital</span>
            </h1>
            
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              Únete a miles de profesionales que ya confían en BookFlow para gestionar sus citas de manera inteligente.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span>Configuración rápida en menos de 5 minutos</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span>30 días de prueba gratuita sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span>Soporte técnico en español las 24/7</span>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 right-32 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 right-10 w-32 h-32 bg-indigo-300/10 rounded-full blur-xl"></div>
        </div>
      </div>

      {/* Register Form */}
      <div className="lg:ml-[50%] flex min-h-screen">
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <img src="/bookingflowlogo.png" alt="BookFlow" className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-gray-900 tracking-tight">BookFlow</span>
              </div>
            </div>

            {/* Header */}
            <div className="text-center lg:text-left mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Crear tu cuenta
              </h2>
              <p className="text-gray-600 text-base">
                Comienza tu prueba gratuita de 30 días
              </p>
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md mb-5 group"
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium">Continuar con Google</span>
            </button>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500 font-medium">O continúa con email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Información Personal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    placeholder="Juan"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    placeholder="Pérez"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400 text-gray-900"
                />
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400 text-gray-900"
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
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-400 text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>


              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creando cuenta...
                  </div>
                ) : (
                  'Crear cuenta gratuita'
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link
                  to="/auth/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
