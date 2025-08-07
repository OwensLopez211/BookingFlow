import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { PasswordRequirements } from '@/components/ui/PasswordRequirements';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';


interface RegisterPageProps {
  heroVariants?: any;
  formVariants?: any;
  decorativeVariants?: any;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ heroVariants, formVariants, decorativeVariants }) => {
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validar campos obligatorios
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else {
      // Validar requisitos de contraseña
      const passwordChecks = [
        { test: formData.password.length >= 8, message: 'Mínimo 8 caracteres' },
        { test: /[A-Z]/.test(formData.password), message: 'Una letra mayúscula' },
        { test: /[a-z]/.test(formData.password), message: 'Una letra minúscula' },
        { test: /\d/.test(formData.password), message: 'Un número' },
        { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password), message: 'Un carácter especial' }
      ];
      
      const failedChecks = passwordChecks.filter(check => !check.test);
      if (failedChecks.length > 0) {
        newErrors.password = `Faltan: ${failedChecks.map(check => check.message).join(', ')}`;
      }
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores antes de continuar', {
        duration: 4000,
        position: 'top-center',
      });
      return false;
    }
    
    if (isLoading) {
      return false; // Prevenir múltiples submissions
    }

    try {
      const success = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        organizationName: 'Mi Empresa', // Temporal, se configurará en onboarding
        templateType: 'custom', // Temporal, se configurará en onboarding
      });

      if (success) {
        toast.success('¡Cuenta creada exitosamente! Bienvenido a BookFlow', {
          duration: 4000,
          position: 'top-center',
        });
        navigate('/onboarding');
      }
    } catch (error) {
      toast.error('Error al crear la cuenta. Verifica tus datos e intenta nuevamente', {
        duration: 4000,
        position: 'top-center',
      });
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

  const handleGoogleSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Google signup será implementado próximamente');
    toast('La autenticación con Google estará disponible pronto', {
      duration: 3000,
      position: 'top-center',
      icon: '🚀',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Section - Desktop Only - Lado Derecho */}
      <motion.div 
        variants={heroVariants}
        className="hidden lg:block fixed inset-y-0 right-0 w-1/2 bg-gradient-to-bl from-purple-600 via-violet-700 to-indigo-800 overflow-hidden">
        <div className="flex flex-col justify-center h-full px-12 xl:px-16 relative">
          <div className="max-w-md relative z-10 ml-auto text-right">
            <div className="flex items-center justify-end space-x-3 mb-8">
              <span className="text-3xl font-bold text-white tracking-tight">BookFlow</span>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <img src="/bookingflowlogo.png" alt="BookFlow" className="w-8 h-8" />
              </div>
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Comienza tu
              <span className="bg-gradient-to-r from-purple-200 to-white bg-clip-text text-transparent block"> transformación digital</span>
            </h1>
            
            <p className="text-purple-100 text-lg leading-relaxed mb-8">
              Únete a miles de profesionales que ya confían en BookFlow para gestionar sus citas de manera inteligente.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-end space-x-3 text-purple-100">
                <span>Configuración rápida en menos de 5 minutos</span>
                <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
              </div>
              <div className="flex items-center justify-end space-x-3 text-purple-100">
                <span>30 días de prueba gratuita sin tarjeta de crédito</span>
                <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
              </div>
              <div className="flex items-center justify-end space-x-3 text-purple-100">
                <span>Soporte técnico en español las 24/7</span>
                <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <motion.div 
            variants={decorativeVariants}
            className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"
          ></motion.div>
          <motion.div 
            variants={decorativeVariants}
            className="absolute bottom-32 left-32 w-48 h-48 bg-purple-400/10 rounded-full blur-2xl"
          ></motion.div>
          <motion.div 
            variants={decorativeVariants}
            className="absolute top-1/2 left-10 w-32 h-32 bg-violet-300/10 rounded-full blur-xl"
          ></motion.div>
          <motion.div 
            variants={decorativeVariants}
            className="absolute bottom-10 right-10 w-20 h-20 bg-indigo-300/10 rounded-full blur-lg"
          ></motion.div>
          <motion.div 
            variants={decorativeVariants}
            className="absolute top-32 right-32 w-16 h-16 bg-purple-300/5 rounded-full blur-md"
          ></motion.div>
        </div>
      </motion.div>

      {/* Register Form - Lado Izquierdo */}
      <motion.div 
        variants={formVariants}
        className="lg:mr-[50%] flex min-h-screen">
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-12 xl:px-16 py-8 lg:py-12 min-h-screen lg:min-h-0">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg">
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
              type="button"
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
            <form 
              onSubmit={handleSubmit} 
              className="space-y-4"
              noValidate
            >
              {/* Información Personal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    placeholder="Juan"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white placeholder-gray-400 text-gray-900 ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.firstName && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1"
                    >
                      {errors.firstName}
                    </motion.p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    placeholder="Pérez"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white placeholder-gray-400 text-gray-900 ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.lastName && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1"
                    >
                      {errors.lastName}
                    </motion.p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white placeholder-gray-400 text-gray-900 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>


              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white placeholder-gray-400 text-gray-900 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
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
                      className="text-red-500 text-xs mt-1"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                  
                  {/* Componentes de validación de contraseña */}
                  <PasswordStrengthMeter password={formData.password} />
                  <PasswordRequirements password={formData.password} />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmar contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white placeholder-gray-400 text-gray-900 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
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
                  {errors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1"
                    >
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </div>
              </div>


              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
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
                  className="font-semibold text-purple-600 hover:text-purple-700 transition-all duration-300 hover:underline underline-offset-4"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
            
            {/* Quick Switch Button */}
            <div className="mt-6 text-center">
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-600 bg-transparent border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-purple-700 hover:border-purple-500 transition-all duration-300 group"
              >
                <motion.span
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                  className="mr-2"
                >
                  →
                </motion.span>
                Cambiar a Inicio de Sesión
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};