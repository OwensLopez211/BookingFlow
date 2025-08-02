// layouts/PublicLayout.tsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Navigation } from '@/components/navigation/Navigation';

export const PublicLayout: React.FC = () => {
  return (
    <div className=" bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Navigation />
      
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer mejorado */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">BookFlow</h3>
              <p className="text-gray-600 text-sm">
                La mejor plataforma para gestionar tu biblioteca personal.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Producto</h4>
              <ul className="space-y-2">
                <li><FooterLink to="/features">Características</FooterLink></li>
                <li><FooterLink to="/pricing">Precios</FooterLink></li>
                <li><FooterLink to="/integrations">Integraciones</FooterLink></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Compañía</h4>
              <ul className="space-y-2">
                <li><FooterLink to="/about">Acerca de</FooterLink></li>
                <li><FooterLink to="/blog">Blog</FooterLink></li>
                <li><FooterLink to="/careers">Carreras</FooterLink></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2">
                <li><FooterLink to="/privacy">Privacidad</FooterLink></li>
                <li><FooterLink to="/terms">Términos</FooterLink></li>
                <li><FooterLink to="/cookies">Cookies</FooterLink></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} BookFlow. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Componente auxiliar para los enlaces del footer
const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  return (
    <Link
      to={to}
      className="text-gray-600 hover:text-primary-600 transition-colors text-sm"
    >
      {children}
    </Link>
  );
};