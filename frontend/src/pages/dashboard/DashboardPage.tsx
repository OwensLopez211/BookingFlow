import React from 'react';
import { Card, Button } from '@/components/ui';
import { PlusIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

export const DashboardPage: React.FC = () => {
  // Mock data - esto vendrá de las APIs después
  const todayAppointments = [
    { id: '1', time: '09:00', client: 'María García', service: 'Corte y Color', resource: 'Ana López' },
    { id: '2', time: '10:30', client: 'Carlos Ruiz', service: 'Sesión Hiperbárica', resource: 'Cámara 1' },
    { id: '3', time: '14:00', client: 'Laura Pérez', service: 'Peinado', resource: 'Sofia Morales' },
    { id: '4', time: '16:30', client: 'Juan Martín', service: 'Sesión Hiperbárica', resource: 'Cámara 2' },
  ];

  const recentActivity = [
    { id: '1', action: 'Nueva cita agendada', client: 'Pedro González', time: '2 min ago' },
    { id: '2', action: 'Cita confirmada', client: 'Ana Rodríguez', time: '15 min ago' },
    { id: '3', action: 'Cita cancelada', client: 'Luis Torres', time: '1 hora ago' },
    { id: '4', action: 'Nueva cita agendada', client: 'Carmen Silva', time: '2 horas ago' },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Bienvenido de vuelta, aquí tienes un resumen de hoy</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button leftIcon={<PlusIcon className="h-4 w-4" />}>
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">24</div>
              <div className="text-sm text-gray-600">Citas Hoy</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">156</div>
              <div className="text-sm text-gray-600">Este Mes</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-orange-600 text-xl">👥</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-sm text-gray-600">Recursos Activos</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">89%</div>
              <div className="text-sm text-gray-600">Ocupación</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Citas de Hoy</h3>
            <Button variant="ghost" size="sm">Ver Todas</Button>
          </div>
          
          <div className="space-y-4">
            {todayAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded">
                    {appointment.time}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{appointment.client}</div>
                    <div className="text-sm text-gray-600">{appointment.service}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {appointment.resource}
                </div>
              </div>
            ))}
          </div>
          
          {todayAppointments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay citas programadas para hoy
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
            <Button variant="ghost" size="sm">Ver Todo</Button>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">{activity.action}</span>
                    {' - '}
                    <span className="text-gray-600">{activity.client}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline">
                📅 Ver Calendario
              </Button>
              <Button variant="outline">
                👥 Gestionar Recursos
              </Button>
              <Button variant="outline">
                ⚙️ Configuración
              </Button>
              <Button variant="outline">
                📊 Reportes
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};