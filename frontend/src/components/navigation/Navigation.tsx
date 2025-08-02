import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export const Navigation: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group"
            >
            <img 
                src="/miniatura.webp" 
                alt="BookFlow Logo"
                className="h-10 w-10" // mismo tamaño que el ícono en tu logo
            />
            <span className="text-[1.50rem] font-[700] leading-none text-gray-900 font-[Plus Jakarta Sans,sans-serif]">
                <span className="block">Booking</span>
                <span className="block">Flow</span>
            </span>
          </Link>


          {/* Navegación */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/features">Características</NavLink>
            <NavLink to="/pricing">Precios</NavLink>
            <NavLink to="/about">Acerca de</NavLink>
            <NavLink to="/blog">Blog</NavLink>
          </nav>

          {/* Botones */}
          <div className="flex items-center space-x-2">
            <Link to="/auth/login">
              <Button variant="ghost" className="hover:bg-gray-100">
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button variant="primary" className="shadow-md hover:shadow-lg transition-shadow">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  return (
    <Link
      to={to}
      className="px-4 py-2 rounded-md text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors font-medium text-sm"
    >
      {children}
    </Link>
  );
};
