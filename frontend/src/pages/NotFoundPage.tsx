import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl font-bold text-primary-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="space-x-4">
          <Link to="/">
            <Button>Volver al Inicio</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline">Ir al Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};