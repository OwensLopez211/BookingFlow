import React, { useState } from 'react';
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { AppointmentData } from '@/services/appointmentService';

interface SimpleAppointmentTooltipProps {
  appointment: AppointmentData;
  children: React.ReactNode;
}

export const SimpleAppointmentTooltip: React.FC<SimpleAppointmentTooltipProps> = ({ 
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
    <div className="relative inline-block w-full h-full">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-pointer w-full h-full"
      >
        {children}
      </div>
      
      {isVisible && (
        <div className="absolute z-50 w-64 p-3 bg-white/95 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl transform -translate-x-1/2 left-1/2 top-full mt-1">
          {/* Arrow */}
          <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2">
            <div className="w-3 h-3 bg-white/95 border border-white/20 rotate-45"></div>
          </div>
          
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 flex-1 pr-2">
              {appointment.title}
            </h3>
            <span className={`
              inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0
              ${getStatusColor(appointment.status)}
            `}>
              {getStatusText(appointment.status)}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center mb-2 text-gray-700">
            <ClockIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            <span className="text-xs font-medium">
              {appointment.startTime} - {appointment.endTime}
            </span>
          </div>

          {/* Client */}
          <div className="flex items-center mb-2 text-gray-700">
            <UserIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
            <span className="text-xs">{appointment.client}</span>
          </div>

          {/* Additional Info */}
          <div className="border-t border-gray-100 pt-2 mt-2">
            <p className="text-xs text-gray-500">Estado: <span className="text-gray-700 font-medium">{getStatusText(appointment.status)}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};