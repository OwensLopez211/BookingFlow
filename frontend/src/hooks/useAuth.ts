import { useAuthStore } from '../stores/authStore';

/**
 * Hook simplificado para acceder al estado de autenticación
 * Wrapper sobre useAuthStore para mantener compatibilidad
 */
export const useAuth = () => {
  const {
    user,
    organization,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    clearError,
    setLoading,
    initialize
  } = useAuthStore();

  return {
    user,
    organization,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    clearError,
    setLoading,
    initialize
  };
};