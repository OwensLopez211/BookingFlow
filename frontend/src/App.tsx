import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider, LoadingScreen } from '@/components/ui';
import { NotificationProvider } from '@/components/notifications';
import { ToastProvider as LoginToastProvider } from '@/hooks/useToast';
import { useAppLoading } from '@/hooks/useAppLoading';
import '@/services/cacheService'; // Inicializar servicio de caché automáticamente

// Layouts
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PrivateLayout } from '@/components/layout/PrivateLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthRedirect } from '@/components/auth/AuthRedirect';
import { AuthTransition } from '@/components/auth/AuthTransition';
import { useAuthStore } from '@/stores/authStore';

// Public Pages
import { HomePage } from '@/pages/HomePage';
import { WelcomePage } from '@/pages/WelcomePage';
import { BookingPage } from '@/pages/public/BookingPage';
import RoadmapPage from '@/pages/RoadmapPage';
import FeaturesPage from '@/pages/FeaturesPage';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

// Onboarding
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage';
import { OneclickReturnPage } from '@/pages/onboarding/OneclickReturnPage';

// Private Pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { AppointmentsPage } from '@/pages/appointments/AppointmentsPage';
import { ResourcesPage } from '@/pages/resources/ResourcesPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { MetricsPage } from '@/pages/MetricsPage';

// 404 Page
import { NotFoundPage } from '@/pages/NotFoundPage';

function App() {
  const initialize = useAuthStore(state => state.initialize);
  const { isLoading } = useAppLoading();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <Router>
        <LoginToastProvider>
          <NotificationProvider>
            <div className="App">
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="pricing" element={<div>Pricing Page</div>} />
            <Route path="about" element={<div>About Page</div>} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="demo" element={<div>Demo Page</div>} />
          </Route>

          {/* Welcome Route - Standalone (no layout for full-screen experience) */}
          <Route path="/welcome" element={<WelcomePage />} />

          {/* Public Booking Routes - No layout wrapper for mobile app experience */}
          <Route path="/book/:orgId" element={<BookingPage />} />

          {/* Auth Routes */}
          {/* Login and Register have their own custom layouts with transitions */}
          <Route path="/auth/login" element={
            <AuthRedirect>
              <AuthTransition>
                <LoginPage />
              </AuthTransition>
            </AuthRedirect>
          } />
          
          <Route path="/auth/register" element={
            <AuthRedirect>
              <AuthTransition>
                <RegisterPage />
              </AuthTransition>
            </AuthRedirect>
          } />
          
          {/* Other auth routes use AuthLayout */}
          <Route path="/auth" element={
            <AuthRedirect>
              <AuthLayout />
            </AuthRedirect>
          }>
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Onboarding Routes */}
          <Route path="/onboarding" element={
            <ProtectedRoute requireOnboarding={false}>
              <OnboardingPage />
            </ProtectedRoute>
          } />
          
          <Route path="/onboarding/oneclick-return" element={
            <ProtectedRoute requireOnboarding={false}>
              <OneclickReturnPage />
            </ProtectedRoute>
          } />

          {/* Legacy auth routes (redirect to new structure) */}
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/register" element={<Navigate to="/auth/register" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />

          {/* Private Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <PrivateLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
          </Route>

          <Route path="/appointments" element={
            <ProtectedRoute>
              <PrivateLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AppointmentsPage />} />
          </Route>

          <Route path="/resources" element={
            <ProtectedRoute>
              <PrivateLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ResourcesPage />} />
          </Route>

          <Route path="/settings" element={
            <ProtectedRoute>
              <PrivateLayout />
            </ProtectedRoute>
          }>
            <Route index element={<SettingsPage />} />
          </Route>

          <Route path="/metrics" element={
            <ProtectedRoute>
              <PrivateLayout />
            </ProtectedRoute>
          }>
            <Route index element={<MetricsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

          {/* Toast Notifications */}
          <ToastProvider />
            </div>
          </NotificationProvider>
        </LoginToastProvider>
      </Router>
    </>
  );
}

export default App;