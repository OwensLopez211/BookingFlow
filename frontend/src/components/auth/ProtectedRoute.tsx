import React, {  } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'owner' | 'admin' | 'staff';
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requireOnboarding = true
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check onboarding status
  if (requireOnboarding && user && (!user.onboardingStatus?.isCompleted)) {
    // If user is not on onboarding page, redirect them there
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // If user has completed onboarding but is on onboarding page, redirect to dashboard
  // BUT ONLY if they have completed ALL 5 steps (not just backend isCompleted flag)
  const hasCompletedAllSteps = user?.onboardingStatus?.completedSteps?.length === 5;
  if (!requireOnboarding && user?.onboardingStatus?.isCompleted && hasCompletedAllSteps && location.pathname === '/onboarding') {
    console.log('ProtectedRoute: Redirecting completed onboarding to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole && user.role !== 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta página</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
