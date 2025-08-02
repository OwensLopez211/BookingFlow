import React from 'react';
import { ClockIcon, UserIcon, } from '@heroicons/react/24/outline';
import { Organization } from '@/types/organization';
import { AppointmentData } from '@/services/appointmentService';

// Use the same interface as the service for consistency  
interface Appointment extends AppointmentData {}

interface AgendaViewProps {
  selectedDate: Date;
  appointments: Appointment[];
  organization?: Organization;
}

// Helper function to create consistent date strings without timezone issues
const formatDateForComparison = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to normalize date strings (handle both ISO and YYYY-MM-DD formats)
const normalizeDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // If it's an ISO string (contains T), extract just the date part
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try to parse and reformat other date formats
  try {
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return formatDateForComparison(parsedDate);
    }
  } catch (error) {
    console.warn('Unable to parse date string:', dateStr);
  }
  
  return dateStr;
};

export const AgendaView: React.FC<AgendaViewProps> = ({ selectedDate, appointments, organization }) => {
  // Get business hours for the selected day
  const getBusinessHours = () => {
    if (!organization?.settings?.businessHours) {
      return Array.from({ length: 12 }, (_, i) => i + 8); // Default 8 AM to 8 PM
    }

    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const businessDay = organization.settings.businessHours[dayName];
    
    if (!businessDay?.isOpen) {
      return []; // No hours if business is closed
    }

    const [startHour] = businessDay.openTime.split(':').map(Number);
    const [endHour] = businessDay.closeTime.split(':').map(Number);
    
    // Generate array of hours from start to end
    const hours = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      hours.push(hour);
    }
    
    return hours;
  };

  const hours = getBusinessHours();
  const minHour = hours.length > 0 ? Math.min(...hours) : 8;
  const maxHour = hours.length > 0 ? Math.max(...hours) : 20;
  
  // Debug logging
  console.log('🔧 AgendaView received:', {
    selectedDate: selectedDate.toISOString().split('T')[0],
    appointmentsCount: appointments.length,
    appointments: appointments,
    organizationModel: organization?.settings?.appointmentSystem?.appointmentModel,
    professionals: organization?.settings?.appointmentSystem?.professionals?.filter(p => p.isActive)?.map(p => ({id: p.id, name: p.name})),
    businessHours: hours,
    minHour,
    maxHour
  });
  
  // Determine if we should show professional columns
  const appointmentModel = organization?.settings?.appointmentSystem?.appointmentModel || 'resource_based';
  const isProfessionalBased = appointmentModel === 'professional_based';
  
  // Get professionals list
  const professionals = organization?.settings?.appointmentSystem?.professionals?.filter(p => p.isActive) || [];
  
  // Filter appointments for the selected date
  const selectedDateStr = formatDateForComparison(selectedDate);
  const dayAppointments = appointments.filter(apt => {
    const normalizedAppointmentDate = normalizeDateString(apt.date);
    const matches = normalizedAppointmentDate === selectedDateStr;
    
    console.log('🔧 Date filtering:', {
      selectedDate: selectedDateStr,
      appointmentRawDate: apt.date,
      appointmentNormalizedDate: normalizedAppointmentDate,
      matches,
      appointmentId: apt.id
    });
    
    return matches;
  });
  
  console.log('🔧 Selected date:', selectedDateStr);
  console.log('🔧 All appointments:', appointments.map(apt => ({ id: apt.id, date: apt.date, startTime: apt.startTime })));
  console.log('🔧 Filtered appointments for date:', dayAppointments);
  console.log('🔧 Is professional based:', isProfessionalBased);
  console.log('🔧 Available professionals:', professionals);
  
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
    
    console.log('🔧 Calculating style for appointment:', appointment.id, {
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      startHour,
      startMinute,
      endHour,
      endMinute
    });
    
    const startPosition = ((startHour - 8) * 60 + startMinute) / 60 * 100;
    const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * 100;
    
    const style = {
      top: `${startPosition}%`,
      height: `${Math.max(duration, 25)}%`, // Minimum height for visibility
    };
    
    console.log('🔧 Calculated style:', style);
    return style;
  };

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

  const getAppointmentColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-emerald-100';
      case 'pending':
        return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-amber-100';
      case 'completed':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-blue-100';
      case 'cancelled':
        return 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 hover:shadow-rose-100';
      default:
        return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:shadow-slate-100';
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
            {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
          </p>
        </div>
        
        <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors">
          + Nueva
        </button>
      </div>

      {/* Agenda Grid - Takes remaining height */}
      <div className="flex-1 relative overflow-y-auto lg:overflow-hidden">
        {hours.length === 0 ? (
          // Business closed - show message
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ClockIcon className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Cerrado
              </h3>
              <p className="text-xs text-gray-600">
                No hay atención este día
              </p>
            </div>
          </div>
        ) : (
          /* Time column */
          <div className="flex h-full min-h-[528px] lg:min-h-0">
            {/* Hours column */}
            <div className="w-14 lg:w-16 flex-shrink-0">
              {isProfessionalBased && professionals.length > 0 && (
                <div className="h-8 border-b border-gray-200"></div>
              )}
              {hours.map((hour) => (
                <div key={hour} className="h-12 flex items-start py-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {formatHour(hour)}
                  </span>
                </div>
              ))}
            </div>

          {/* Professional columns or single appointments column */}
          {isProfessionalBased && professionals.length > 0 ? (
            // Professional-based layout with multiple columns
            <div className="flex-1 grid border-l border-gray-200" style={{ gridTemplateColumns: `repeat(${professionals.length}, 1fr)` }}>
              {professionals.map((professional, professionalIndex) => (
                <div key={professional.id} className={`relative ${professionalIndex > 0 ? 'border-l border-gray-200' : ''}`}>
                  {/* Professional header */}
                  <div className="sticky top-0 z-30 bg-white border-b border-gray-200 h-8 flex items-center px-2">
                    <div className="flex items-center space-x-2">
                      {professional.photo && (
                        <img 
                          src={professional.photo} 
                          alt={professional.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      )}
                      <span className="text-xs font-medium text-gray-700 truncate">{professional.name}</span>
                    </div>
                  </div>

                  {/* Hour lines for this professional */}
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
                      if (currentHour >= minHour && currentHour <= maxHour) {
                        const position = ((currentHour - minHour) * 60 + currentMinute) / 60 * 48 + 32; // +32 for header (8px height + padding)
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

                  {/* Appointments for this professional */}
                  {dayAppointments
                    .filter(appointment => {
                      const matches = appointment.professionalId === professional.id;
                      console.log('🔧 Professional filter:', appointment.id, 'professionalId:', appointment.professionalId, 'expected:', professional.id, 'matches:', matches);
                      return matches;
                    })
                    .map((appointment) => {
                      console.log('🔧 Rendering appointment for professional:', appointment.id, professional.name);
                      const startHour = parseInt(appointment.startTime.split(':')[0]);
                      const startMinute = parseInt(appointment.startTime.split(':')[1]);
                      const endHour = parseInt(appointment.endTime.split(':')[0]);
                      const endMinute = parseInt(appointment.endTime.split(':')[1]);
                      
                      // Skip appointments outside our visible hours
                      if (startHour < minHour || startHour >= maxHour) {
                        console.log('🔧 Skipping appointment outside visible hours:', appointment.id, startHour);
                        return null;
                      }
                      
                      const startPosition = ((startHour - minHour) * 60 + startMinute) / 60 * 48 + 32; // +32 for header (8px height + padding)
                      const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * 48;
                      
                      console.log('🔧 Professional appointment positioning:', {
                        id: appointment.id,
                        professionalId: professional.id,
                        startHour,
                        startMinute,
                        startPosition,
                        duration
                      });
                      
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
                              h-full rounded-lg border-l-4 backdrop-blur-sm cursor-pointer transition-all duration-300 
                              hover:scale-[1.02] hover:shadow-lg group relative overflow-hidden
                              ${getAppointmentColor(appointment.status)}
                              p-2 md:p-3
                            `}
                            style={{ minHeight: '50px' }}
                          >
                            {/* Subtle shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            
                            <div className="relative z-10">
                              <div className="flex items-start justify-between mb-1 md:mb-2">
                                <h4 className="font-semibold text-gray-900 text-xs md:text-sm leading-tight truncate pr-1">
                                  {appointment.title}
                                </h4>
                                <span className={`
                                  px-1.5 py-0.5 md:px-2 md:py-1 text-xs font-medium rounded-full shrink-0 
                                  ${getStatusColor(appointment.status)}
                                  shadow-sm
                                `}>
                                  {getStatusText(appointment.status)}
                                </span>
                              </div>
                              
                              <div className="space-y-1 md:space-y-1.5">
                                <div className="flex items-center text-xs text-gray-700">
                                  <ClockIcon className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5 text-gray-500" />
                                  <span className="font-medium text-xs">{appointment.startTime} - {appointment.endTime}</span>
                                </div>
                                
                                <div className="flex items-center text-xs text-gray-700">
                                  <UserIcon className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5 text-gray-500" />
                                  <span className="truncate text-xs">{appointment.client}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          ) : (
            // Resource-based or single column layout
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
                  if (currentHour >= minHour && currentHour <= maxHour) {
                    const position = ((currentHour - minHour) * 60 + currentMinute) / 60 * 48; // 48px per hour
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
              {dayAppointments.map((appointment) => {
                console.log('🔧 Rendering resource-based appointment:', appointment.id);
                const startHour = parseInt(appointment.startTime.split(':')[0]);
                const startMinute = parseInt(appointment.startTime.split(':')[1]);
                const endHour = parseInt(appointment.endTime.split(':')[0]);
                const endMinute = parseInt(appointment.endTime.split(':')[1]);
                
                // Skip appointments outside our visible hours
                if (startHour < minHour || startHour >= maxHour) {
                  console.log('🔧 Skipping appointment outside visible hours:', appointment.id, startHour);
                  return null;
                }
                
                const startPosition = ((startHour - minHour) * 60 + startMinute) / 60 * 48;
                const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * 48;
                
                console.log('🔧 Resource appointment positioning:', {
                  id: appointment.id,
                  startHour,
                  startMinute,
                  startPosition,
                  duration
                });
                
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
                        h-full rounded-lg border-l-4 backdrop-blur-sm cursor-pointer transition-all duration-300 
                        hover:scale-[1.02] hover:shadow-lg group relative overflow-hidden
                        ${getAppointmentColor(appointment.status)}
                        p-2 md:p-3
                      `}
                      style={{ minHeight: '50px' }}
                    >
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-1 md:mb-2">
                          <h4 className="font-semibold text-gray-900 text-xs md:text-sm leading-tight truncate pr-1">
                            {appointment.title}
                          </h4>
                          <span className={`
                            px-1.5 py-0.5 md:px-2 md:py-1 text-xs font-medium rounded-full shrink-0 
                            ${getStatusColor(appointment.status)}
                            shadow-sm
                          `}>
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                        
                        <div className="space-y-1 md:space-y-1.5">
                          <div className="flex items-center text-xs text-gray-700">
                            <ClockIcon className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5 text-gray-500" />
                            <span className="font-medium text-xs">{appointment.startTime} - {appointment.endTime}</span>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-700">
                            <UserIcon className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5 text-gray-500" />
                            <span className="truncate text-xs">{appointment.client}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {dayAppointments.length === 0 && (
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
          )}
          </div>
        )}
      </div>
    </div>
  );
};