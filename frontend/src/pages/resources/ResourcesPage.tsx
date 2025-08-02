import React from 'react';
import { Card, Button } from '@/components/ui';
import { PlusIcon } from '@heroicons/react/24/outline';

export const ResourcesPage: React.FC = () => {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Recursos</h1>
          <p className="text-gray-600">Administra profesionales, equipos y horarios</p>
        </div>
        <Button leftIcon={<PlusIcon className="h-4 w-4" />}>
          Nuevo Recurso
        </Button>
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">👥</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Próximamente</h3>
          <p className="text-gray-600 mb-6">
            La gestión de recursos estará disponible pronto
          </p>
          <Button variant="outline">
            Configurar Templates
          </Button>
        </div>
      </Card>
    </div>
  );
};