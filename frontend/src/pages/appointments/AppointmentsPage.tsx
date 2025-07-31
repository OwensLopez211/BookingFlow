import React, { useState } from 'react';
import { Calendar, AgendaView } from '@/components/calendar';
import { showToast } from '@/components/ui';
import { 
  PresentationChartBarIcon, 
  UserGroupIcon, 
  ClockIcon, 
  CheckBadgeIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

// Mock data
const mockAppointments: Record<string, Array<{
  id: string;
  title: string;
  client: string;
  phone: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'completed';
  color: string;
}>> = {
  '2025-01-31': [
    {
      id: '1',
      title: 'Corte y Peinado',
      client: 'María González',
      phone: '+34 666 123 456',
      startTime: '09:00',
      endTime: '10:30',
      status: 'confirmed',
      color: 'bg-green-50 border-green-200'
    },
    {
      id: '2',
      title: 'Coloración',
      client: 'Ana Rodríguez',
      phone: '+34 666 789 012',
      startTime: '11:00',
      endTime: '13:00',
      status: 'confirmed',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: '3',
      title: 'Manicura',
      client: 'Carmen López',
      phone: '+34 666 345 678',
      startTime: '16:00',
      endTime: '17:00',
      status: 'pending',
      color: 'bg-yellow-50 border-yellow-200'
    }
  ],
  '2025-02-01': [
    {
      id: '4',
      title: 'Tratamiento Facial',
      client: 'Laura Martín',
      phone: '+34 666 901 234',
      startTime: '10:00',
      endTime: '11:30',
      status: 'confirmed',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      id: '5',
      title: 'Pedicura',
      client: 'Isabel García',
      phone: '+34 666 567 890',
      startTime: '15:30',
      endTime: '16:30',
      status: 'completed',
      color: 'bg-gray-50 border-gray-200'
    }
  ],
  '2025-02-03': [
    {
      id: '6',
      title: 'Corte Infantil',
      client: 'Pedro Sánchez',
      phone: '+34 666 234 567',
      startTime: '12:00',
      endTime: '12:45',
      status: 'confirmed',
      color: 'bg-indigo-50 border-indigo-200'
    }
  ]
};

const getAppointmentCounts = () => {
  const counts: { [key: string]: number } = {};
  Object.entries(mockAppointments).forEach(([date, appointments]) => {
    counts[date] = appointments.length;
  });
  return counts;
};

export const AppointmentsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'agenda'>('agenda');
  
  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const todayAppointments = mockAppointments[selectedDateKey] || [];
  const appointmentCounts = getAppointmentCounts();

  // Stats for the dashboard cards
  const totalAppointments = Object.values(mockAppointments).flat().length;
  const todayCount = todayAppointments.length;
  const confirmedCount = Object.values(mockAppointments).flat().filter(a => a.status === 'confirmed').length;
  const completedCount = Object.values(mockAppointments).flat().filter(a => a.status === 'completed').length;

  const handleNewAppointment = () => {
    showToast.success(
      '¡Cita creada exitosamente!',
      'La nueva cita se ha agregado al calendario. El cliente recibirá una confirmación por email.'
    );
  };

  const handleTestToasts = () => {
    // Demo function to show different toast types
    setTimeout(() => showToast.info('Información', 'Esta es una notificación informativa'), 500);
    setTimeout(() => showToast.warning('Advertencia', 'Esta es una notificación de advertencia'), 1000);
    setTimeout(() => showToast.error('Error', 'Esta es una notificación de error'), 1500);
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full flex-col space-y-6">
        {/* Desktop Header Design */}
        <div className="flex-shrink-0 relative">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl opacity-90"></div>
          <div className="absolute inset-0 bg-white/5 rounded-2xl"></div>
          
          <div className="relative p-6 rounded-2xl backdrop-blur-sm">
            {/* Header Title */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <CalendarDaysIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Panel de Calendario</h1>
                  <p className="text-blue-100">Gestiona todas las citas de tu negocio</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-white" />
                  <span className="text-white font-medium text-sm">En crecimiento</span>
                </div>
                <button 
                  onClick={handleTestToasts}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border border-white/20"
                  title="Demo de notificaciones"
                >
                  🔔 Demo
                </button>
                <button 
                  onClick={handleNewAppointment}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 border border-white/20"
                >
                  + Nueva Cita
                </button>
              </div>
            </div>

            {/* Desktop Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              {/* Total Appointments */}
              <div className="group">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                          <PresentationChartBarIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                      </div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Total de Citas</p>
                      <p className="text-2xl font-bold text-white">{totalAppointments}</p>
                      <p className="text-xs text-blue-200 mt-1">+12% este mes</p>
                    </div>
                    <div className="text-amber-400/50 group-hover:text-amber-400 transition-colors">
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Appointments */}
              <div className="group">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                          <ClockIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      </div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Citas de Hoy</p>
                      <p className="text-2xl font-bold text-white">{todayCount}</p>
                      <p className="text-xs text-blue-200 mt-1">
                        {todayCount > 0 ? 'Día ocupado' : 'Día libre'}
                      </p>
                    </div>
                    <div className="text-emerald-400/50 group-hover:text-emerald-400 transition-colors">
                      <CalendarDaysIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmed Appointments */}
              <div className="group">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                          <UserGroupIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      </div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Confirmadas</p>
                      <p className="text-2xl font-bold text-white">{confirmedCount}</p>
                      <p className="text-xs text-blue-200 mt-1">
                        {Math.round((confirmedCount / totalAppointments) * 100)}% del total
                      </p>
                    </div>
                    <div className="text-blue-400/50 group-hover:text-blue-400 transition-colors">
                      <CheckBadgeIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Completed Appointments */}
              <div className="group">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                          <CheckBadgeIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      </div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Completadas</p>
                      <p className="text-2xl font-bold text-white">{completedCount}</p>
                      <p className="text-xs text-blue-200 mt-1">Excelente trabajo</p>
                    </div>
                    <div className="text-purple-400/50 group-hover:text-purple-400 transition-colors">
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Calendar and Agenda Layout */}
        <div className="flex-1 grid grid-cols-5 gap-6 min-h-0">
          <div className="col-span-2">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              appointments={appointmentCounts}
            />
          </div>
          <div className="col-span-3">
            <AgendaView
              selectedDate={selectedDate}
              appointments={todayAppointments}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden h-full flex flex-col pb-20">
        {/* Mobile Header - Compact */}
        <div className="flex-shrink-0 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl opacity-95"></div>
          <div className="relative p-4 rounded-2xl backdrop-blur-sm">
            {/* Mobile Title */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <CalendarDaysIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Calendario</h1>
                  <p className="text-xs text-blue-100">Gestiona tus citas</p>
                </div>
              </div>
              
              <button 
                onClick={handleNewAppointment}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/20"
              >
                + Nueva
              </button>
            </div>

            {/* Mobile Stats - Single Container */}
            <div className="bg-white/15 backdrop-blur-lg border border-white/30 rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Today's Count - Most Important */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <ClockIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-blue-100 text-xs font-medium">Hoy</p>
                    <p className="text-xl font-bold text-white leading-tight">{todayCount}</p>
                  </div>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></div>
                </div>

                {/* Total */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <PresentationChartBarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-blue-100 text-xs font-medium">Total</p>
                    <p className="text-xl font-bold text-white leading-tight">{totalAppointments}</p>
                  </div>
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse flex-shrink-0"></div>
                </div>

                {/* Confirmed */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <UserGroupIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-blue-100 text-xs font-medium">Confirm.</p>
                    <p className="text-xl font-bold text-white leading-tight">{confirmedCount}</p>
                  </div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse flex-shrink-0"></div>
                </div>

                {/* Completed */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckBadgeIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-blue-100 text-xs font-medium">Complet.</p>
                    <p className="text-xl font-bold text-white leading-tight">{completedCount}</p>
                  </div>
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse flex-shrink-0"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('agenda')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 relative ${
                activeTab === 'agenda'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <ClockIcon className="h-4 w-4" />
                <span>Agenda</span>
              </div>
              {activeTab === 'agenda' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 relative ${
                activeTab === 'calendar'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <CalendarDaysIcon className="h-4 w-4" />
                <span>Calendario</span>
              </div>
              {activeTab === 'calendar' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Content Area - Fixed height to prevent overflow */}
        <div className="flex-1 px-4 py-2 min-h-0 overflow-hidden">
          <div className="h-full">
            {activeTab === 'agenda' ? (
              <AgendaView
                selectedDate={selectedDate}
                appointments={todayAppointments}
              />
            ) : (
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                appointments={appointmentCounts}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};