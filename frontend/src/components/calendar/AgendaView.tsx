import React from 'react';
import { ClockIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';

interface Appointment {
  id: string;
  title: string;
  client: string;
  phone?: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  color: string;
}

interface AgendaViewProps {
  selectedDate: Date;
  appointments: Appointment[];
}

export const AgendaView: React.FC<AgendaViewProps> = ({ selectedDate, appointments }) => {
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  const getAppointmentStyle = (appointment: Appointment) => {
    const startHour = parseInt(appointment.startTime.split(':')[0]);
    const startMinute = parseInt(appointment.startTime.split(':')[1]);
    const endHour = parseInt(appointment.endTime.split(':')[0]);
    const endMinute = parseInt(appointment.endTime.split(':')[1]);
    
    const startPosition = ((startHour - 8) * 60 + startMinute) / 60 * 100;
    const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * 100;
    
    return {
      top: `${startPosition}%`,
      height: `${Math.max(duration, 25)}%`, // Minimum height for visibility
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 capitalize">
            {formatDate(selectedDate)}
          </h2>
          <p className="text-xs text-gray-600">
            {appointments.length} {appointments.length === 1 ? 'cita' : 'citas'}
          </p>
        </div>
        
        <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors">
          + Nueva
        </button>
      </div>

      {/* Agenda Grid - Takes remaining height */}
      <div className="flex-1 relative overflow-y-auto lg:overflow-hidden">
        {/* Time column */}
        <div className="flex h-full min-h-[528px] lg:min-h-0">
          {/* Hours column */}
          <div className="w-14 lg:w-16 flex-shrink-0">
            {hours.map((hour) => (
              <div key={hour} className="h-12 flex items-start py-1">
                <span className="text-xs text-gray-500 font-medium">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Appointments column */}
          <div className="flex-1 relative border-l border-gray-200">
            {/* Hour lines */}
            {hours.map((hour, index) => (
              <div
                key={hour}
                className={`h-12 border-b border-gray-100 ${
                  index === hours.length - 1 ? 'border-b-0' : ''
                }`}
              />
            ))}

            {/* Current time indicator */}
            {(() => {
              const now = new Date();
              const isToday = selectedDate.toDateString() === now.toDateString();
              if (isToday) {
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                if (currentHour >= 8 && currentHour <= 18) {
                  const position = ((currentHour - 8) * 60 + currentMinute) / 60 * 48; // 48px per hour
                  return (
                    <div
                      className="absolute left-0 right-0 z-10"
                      style={{ top: `${position}px` }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm"></div>
                        <div className="flex-1 h-0.5 bg-red-500"></div>
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })()}

            {/* Appointments */}
            {appointments.map((appointment) => {
              const startHour = parseInt(appointment.startTime.split(':')[0]);
              const startMinute = parseInt(appointment.startTime.split(':')[1]);
              const endHour = parseInt(appointment.endTime.split(':')[0]);
              const endMinute = parseInt(appointment.endTime.split(':')[1]);
              
              const startPosition = ((startHour - 8) * 60 + startMinute) / 60 * 48;
              const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * 48;
              
              return (
                <div
                  key={appointment.id}
                  className="absolute left-1 right-1 z-20"
                  style={{
                    top: `${startPosition}px`,
                    height: `${Math.max(duration, 32)}px`
                  }}
                >
                  <div 
                    className={`
                      h-full p-2 rounded-md border shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md
                      ${appointment.color || 'bg-blue-50 border-blue-200'}
                    `}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 text-xs leading-tight truncate">
                        {appointment.title}
                      </h4>
                      <span className={`
                        px-1.5 py-0.5 text-xs font-medium rounded-full border flex-shrink-0 ml-1
                        ${getStatusColor(appointment.status)}
                      `}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-0.5">
                      <div className="flex items-center text-xs text-gray-600">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        <span className="truncate">{appointment.startTime} - {appointment.endTime}</span>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-600">
                        <UserIcon className="h-3 w-3 mr-1" />
                        <span className="truncate">{appointment.client}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {appointments.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ClockIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    No hay citas
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Sin citas agendadas
                  </p>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors">
                    Programar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};