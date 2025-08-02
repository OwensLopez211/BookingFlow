import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';

// Layouts
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PrivateLayout } from '@/components/layout/PrivateLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthRedirect } from '@/components/auth/AuthRedirect';
import { useAuthStore } from '@/stores/authStore';

// Public Pages
import { HomePage } from '@/pages/HomePage';
import { BookingPage } from '@/pages/public/BookingPage';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

// Onboarding
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage';

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

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="features" element={<div>Features Page</div>} />
            <Route path="pricing" element={<div>Pricing Page</div>} />
            <Route path="about" element={<div>About Page</div>} />
            <Route path="demo" element={<div>Demo Page</div>} />
          </Route>

          {/* Public Booking Routes - No layout wrapper for mobile app experience */}
          <Route path="/book/:orgId" element={<BookingPage />} />

          {/* Auth Routes */}
          {/* Login and Register have their own custom layouts */}
          <Route path="/auth/login" element={
            <AuthRedirect>
              <LoginPage />
            </AuthRedirect>
          } />
          
          <Route path="/auth/register" element={
            <AuthRedirect>
              <RegisterPage />
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

          {/* Onboarding Route */}
          <Route path="/onboarding" element={
            <ProtectedRoute requireOnboarding={false}>
              <OnboardingPage />
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
    </Router>
  );
}

export default App;