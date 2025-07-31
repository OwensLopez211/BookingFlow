import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';

interface AuthRedirectProps {
  children: React.ReactNode;
}

export const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  
  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && (
    location.pathname === '/auth/login' || 
    location.pathname === '/auth/register' ||
    location.pathname === '/login' ||
    location.pathname === '/register'
  )) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};