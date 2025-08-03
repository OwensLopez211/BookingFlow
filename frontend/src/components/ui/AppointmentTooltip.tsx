import React, { useState } from 'react';
import { ClockIcon, UserIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { AppointmentData } from '@/services/appointmentService';

interface AppointmentTooltipProps {
  appointment: AppointmentData;
  children: React.ReactNode;
}

export const AppointmentTooltip: React.FC<AppointmentTooltipProps> = ({ 
  appointment, 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
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
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-pointer"
      >
        {children}
      </div>
      
      {isVisible && (
        <div className="absolute z-50 w-80 p-4 bg-white/95 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl transform -translate-x-1/2 left-1/2 top-full mt-2">
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-4 h-4 bg-white/95 border border-white/20 rotate-45"></div>
          </div>
          
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {appointment.title}
              </h3>
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${getStatusColor(appointment.status)}
              `}>
                {getStatusText(appointment.status)}
              </span>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center mb-3 text-gray-700">
            <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium">
              {appointment.startTime} - {appointment.endTime}
            </span>
          </div>

          {/* Client */}
          <div className="flex items-center mb-3 text-gray-700">
            <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm">{appointment.client}</span>
          </div>

          {/* Contact Info */}
          <div className="border-t border-gray-100 pt-3 mt-3">
            <p className="text-xs text-gray-500 mb-2">Información adicional</p>
            <p className="text-xs text-gray-600">ID: {appointment.id}</p>
          </div>
        </div>
      )}
    </div>
  );
};