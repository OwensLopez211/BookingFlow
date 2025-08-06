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

  // Check onboarding status with better logging
  const onboardingCompleted = user?.onboardingStatus?.isCompleted;
  const completedStepsCount = user?.onboardingStatus?.completedSteps?.length || 0;
  const hasCompletedAllSteps = completedStepsCount === 5;
  
  console.log('🔍 ProtectedRoute check:', {
    requireOnboarding,
    onboardingCompleted,
    completedStepsCount,
    hasCompletedAllSteps,
    currentPath: location.pathname,
    userId: user?.id
  });

  // Only redirect to onboarding if:
  // 1. Route requires onboarding completion
  // 2. User is NOT currently on onboarding pages
  // 3. Either onboarding is not completed OR less than 5 steps are done
  if (requireOnboarding && user && (!onboardingCompleted || !hasCompletedAllSteps)) {
    const isOnOnboardingPage = location.pathname.startsWith('/onboarding');
    if (!isOnOnboardingPage) {
      console.log('🔄 ProtectedRoute: Redirecting to onboarding - incomplete onboarding');
      return <Navigate to="/onboarding" replace />;
    }
  }

  // If user has completed onboarding but is on onboarding page, redirect to dashboard
  if (!requireOnboarding && onboardingCompleted && hasCompletedAllSteps && location.pathname === '/onboarding') {
    console.log('🔄 ProtectedRoute: Redirecting completed onboarding to dashboard');
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
