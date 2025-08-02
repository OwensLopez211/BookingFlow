import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { Hero } from '@/components/sections/Hero';

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <Hero />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* ... tus cards */}
        </div>

        {/* CTA Section */}
        <div className="bg-primary-50 rounded-2xl p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          ¿Listo para optimizar tu negocio?
        </h2>
        <p className="text-gray-600 mb-6">
          Únete a cientos de empresas que ya confían en BookFlow
        </p>
        <Link to="/register">
          <Button size="lg">Empezar Ahora - Es Gratis</Button>
        </Link>
        </div>
      </div>
    </div>
  );
};
