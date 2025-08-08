import React, { useState } from 'react';
import { ClockIcon, UserIcon, CalendarDaysIcon, PlusIcon } from '@heroicons/react/24/outline';
import { AppointmentData } from '@/services/appointmentService';
import { AppointmentTooltip, CreateAppointmentModal } from '@/components/ui';

// Temporary type definitions
interface Professional {
  id: string;
  name: string;
  photo?: string;
  isActive: boolean;
}

interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface Organization {
  settings?: {
    businessHours?: BusinessHours;
    appointmentSystem?: {
      appointmentModel?: 'professional_based' | 'resource_based';
      professionals?: Professional[];
    };
    services?: Array<{
      id: string;
      name: string;
      description?: string;
      duration: number;
      price: number;
      isActive?: boolean;
    }>;
  };
}

// Use the same interface as the service for consistency  
interface Appointment extends AppointmentData {}

interface AgendaViewProps {
  selectedDate: Date;
  appointments: Appointment[];
  organization?: Organization;
  onCreateAppointment?: (appointmentData: any) => void;
}

// Helper function to create consistent date strings without timezone issues
const formatDateForComparison = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to normalize date strings (handle both ISO and YYYY-MM-DD formats)

export const AgendaView: React.FC<AgendaViewProps> = ({ selectedDate, appointments, organization, onCreateAppointment }) => {
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    time: string;
    professionalId?: string;
  } | null>(null);
  
  // Mobile detection hook
  const [isMobile, setIsMobile] = useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle time slot click
  const handleTimeSlotClick = (time: string, professionalId?: string) => {
    setSelectedTimeSlot({ time, professionalId });
    setIsCreateModalOpen(true);
  };

  // Handle appointment creation
  const handleCreateAppointment = (appointmentData: any) => {
    if (onCreateAppointment) {
      onCreateAppointment(appointmentData);
    }
    setIsCreateModalOpen(false);
    setSelectedTimeSlot(null);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setSelectedTimeSlot(null);
  };
  // Debug logging
  console.log('🔧 AgendaView received:', {
    selectedDate: selectedDate.toISOString().split('T')[0],
    appointmentsCount: appointments.length,
    appointments: appointments,
    organizationModel: organization?.settings?.appointmentSystem?.appointmentModel
  });

  // Determine if we should show professional columns
  const appointmentModel = organization?.settings?.appointmentSystem?.appointmentModel || 'resource_based';
  const isProfessionalBased = appointmentModel === 'professional_based';
  
  // Get professionals list
  const professionals = organization?.settings?.appointmentSystem?.professionals?.filter(p => p.isActive) || [];
  
  console.log('🔧 Professional setup:', {
    isProfessionalBased,
    professionals: professionals.map(p => ({ id: p.id, name: p.name }))
  });
  
  // Log all appointments with their professional IDs
  console.log('🔧 All appointments with professional IDs:', 
    appointments.map(apt => ({
      id: apt.id,
      title: apt.title,
      date: apt.date,
      professionalId: apt.professionalId,
      hasValidProfessionalId: !!apt.professionalId
    }))
  );

  // Filter appointments for the selected date
  const selectedDateStr = formatDateForComparison(selectedDate);
  const dayAppointments = appointments.filter(apt => {
    const normalizedAppointmentDate = apt.date.split('T')[0]; // Get just the date part
    const matches = normalizedAppointmentDate === selectedDateStr;
    console.log('🔧 Date filtering:', {
      selectedDate: selectedDateStr,
      appointmentRawDate: apt.date,
      appointmentNormalizedDate: normalizedAppointmentDate,
      matches,
      appointmentId: apt.id,
      appointmentTitle: apt.title
    });
    return matches;
  });

  console.log('🔧 Filtered appointments for selected date:', {
    selectedDate: selectedDateStr,
    totalAppointments: appointments.length,
    filteredAppointments: dayAppointments.length,
    dayAppointments: dayAppointments.map(apt => ({
      id: apt.id,
      title: apt.title,
      professionalId: apt.professionalId
    }))
  });
  

  // Check if business is closed
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const businessDay = organization?.settings?.businessHours?.[dayName];
  const isClosed = businessDay ? !businessDay.isOpen : false;

  // Get time slots for the day
  const getTimeSlots = () => {
    if (!organization?.settings?.businessHours) {
      // Default 8 AM to 8 PM in 30-minute intervals
      const slots = [];
      for (let hour = 8; hour < 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          slots.push({ 
            hour, 
            minute, 
            time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
            displayTime: hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`
          });
        }
      }
      return slots;
    }

    const businessDay = organization.settings.businessHours[dayName];
    
    if (!businessDay?.isOpen) {
      return [];
    }

    const [startHour, startMinute] = businessDay.openTime.split(':').map(Number);
    const [endHour, endMinute] = businessDay.closeTime.split(':').map(Number);
    
    const slots = [];
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
      slots.push({ 
        hour: currentHour, 
        minute: currentMinute, 
        time: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
        displayTime: currentHour === 12 ? '12 PM' : currentHour > 12 ? `${currentHour - 12} PM` : `${currentHour} AM`
      });
      
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  const timeSlots = getTimeSlots();

  // Helper function to convert time to minutes for comparison
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to calculate precise appointment positioning based on time slots
  const calculateAppointmentPosition = (appointment: Appointment, timeSlots: any[]) => {
    if (timeSlots.length === 0) return { startPosition: 0, height: 48 };
    
    // Debug time parsing
    console.log(`🔧 Parsing times for ${appointment.id}:`, {
      startTimeRaw: appointment.startTime,
      endTimeRaw: appointment.endTime,
      startTimeParsed: timeToMinutes(appointment.startTime),
      endTimeParsed: timeToMinutes(appointment.endTime)
    });
    
    const startTimeMinutes = timeToMinutes(appointment.startTime);
    const endTimeMinutes = timeToMinutes(appointment.endTime);
    
    // Find the first and last time slots to get business hours bounds
    const firstSlot = timeSlots[0];
    const lastSlot = timeSlots[timeSlots.length - 1];
    const businessStartMinutes = firstSlot.hour * 60 + firstSlot.minute;
    const businessEndMinutes = lastSlot.hour * 60 + lastSlot.minute + 30; // Add 30 minutes for last slot duration
    
    // Each time slot is 30 minutes and 48px high
    const slotDurationMinutes = 30;
    const slotHeightPx = 48;
    const pixelsPerMinute = slotHeightPx / slotDurationMinutes; // 1.6 pixels per minute
    
    // Clamp appointment times to business hours for positioning
    const clampedStartMinutes = Math.max(businessStartMinutes, Math.min(startTimeMinutes, businessEndMinutes));
    const clampedEndMinutes = Math.max(businessStartMinutes, Math.min(endTimeMinutes, businessEndMinutes));
    
    // Calculate start position relative to business hours start
    const startOffsetMinutes = clampedStartMinutes - businessStartMinutes;
    const startPosition = startOffsetMinutes * pixelsPerMinute;
    
    // Calculate height based on clamped appointment duration
    const appointmentDurationMinutes = clampedEndMinutes - clampedStartMinutes;
    const height = Math.max(24, appointmentDurationMinutes * pixelsPerMinute); // Minimum 24px height
    
    console.log('🔧 Precise positioning calculation:', {
      appointmentId: appointment.id,
      appointmentTitle: appointment.title || 'No title',
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      originalStartMinutes: startTimeMinutes,
      originalEndMinutes: endTimeMinutes,
      clampedStartMinutes,
      clampedEndMinutes,
      businessStartMinutes,
      businessEndMinutes,
      startOffsetMinutes,
      appointmentDurationMinutes,
      startPosition: Math.round(startPosition),
      height: Math.round(height),
      pixelsPerMinute,
      isStartClamped: startTimeMinutes < businessStartMinutes,
      isEndClamped: endTimeMinutes > businessEndMinutes,
      timeSlotCount: timeSlots.length,
      rawAppointmentData: {
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        id: appointment.id,
        title: appointment.title
      }
    });
    
    return {
      startPosition: Math.round(startPosition),
      height: Math.round(height)
    };
  };

  // Helper function to check if two appointments overlap
  const appointmentsOverlap = (apt1: Appointment, apt2: Appointment): boolean => {
    const apt1Start = timeToMinutes(apt1.startTime);
    const apt1End = timeToMinutes(apt1.endTime);
    const apt2Start = timeToMinutes(apt2.startTime);
    const apt2End = timeToMinutes(apt2.endTime);
    
    return apt1Start < apt2End && apt2Start < apt1End;
  };

  // Helper function to group overlapping appointments
  const groupOverlappingAppointments = (appointments: Appointment[]): Appointment[][] => {
    const groups: Appointment[][] = [];
    const processed = new Set<string>();
    
    for (const appointment of appointments) {
      if (processed.has(appointment.id)) continue;
      
      const group = [appointment];
      processed.add(appointment.id);
      
      // Find all appointments that overlap with this one or any in the group
      for (const otherAppointment of appointments) {
        if (processed.has(otherAppointment.id)) continue;
        
        const overlapsWithAny = group.some(groupApt => 
          appointmentsOverlap(groupApt, otherAppointment)
        );
        
        if (overlapsWithAny) {
          group.push(otherAppointment);
          processed.add(otherAppointment.id);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  };

  // Helper function to calculate layout for overlapping appointments
  const calculateAppointmentLayout = (appointment: Appointment, groupAppointments: Appointment[], isMobile?: boolean) => {
    // Sort appointments in the group by start time, then by id for consistency
    const sortedGroup = [...groupAppointments].sort((a, b) => {
      const timeComparison = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
      return timeComparison !== 0 ? timeComparison : a.id.localeCompare(b.id);
    });
    
    const appointmentIndex = sortedGroup.findIndex(apt => apt.id === appointment.id);
    const totalInGroup = sortedGroup.length;
    
    // Calculate width and left offset - adjust for mobile
    const baseWidth = isMobile && totalInGroup > 2 ? 85 : 90; // Slightly wider on mobile for 3+ appointments
    const width = totalInGroup > 1 ? `${Math.floor(baseWidth / totalInGroup)}%` : `${baseWidth}%`;
    const leftOffset = totalInGroup > 1 ? `${appointmentIndex * (baseWidth / totalInGroup) + (isMobile ? 3 : 2)}%` : `${isMobile ? 3 : 2}%`;
    
    return {
      width,
      leftOffset,
      zIndex: 20 + appointmentIndex, // Higher index = higher z-index
      totalInGroup,
      appointmentIndex,
      isMobile
    };
  };

  // Helper functions
  function getStatusColor(status: string) {
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
  }

  function getAppointmentColor(status: string) {
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
  }

  function getStatusText(status: string) {
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
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isClosed) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {formatDate(selectedDate)}
            </h2>
            <p className="text-sm text-gray-600">Negocio cerrado</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + Nueva Cita
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cerrado</h3>
            <p className="text-gray-600 mb-4">No hay atención este día</p>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Configurar horarios
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 capitalize">
            {formatDate(selectedDate)}
          </h2>
          <p className="text-sm text-gray-600">
            {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
            {isProfessionalBased && professionals.length > 0 && (
              <span className="ml-2 text-blue-600">
                • {professionals.length} {professionals.length === 1 ? 'profesional' : 'profesionales'}
              </span>
            )}
          </p>
        </div>
        
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <CalendarDaysIcon className="h-4 w-4" />
          <span>Nueva Cita</span>
        </button>
      </div>

      {/* Custom Agenda Grid */}
      <div className="flex-1 overflow-hidden">
        {timeSlots.length === 0 ? (
          // Business closed
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Cerrado</h3>
              <p className="text-gray-600 mb-4">No hay atención este día</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full">
            {/* Time column */}
            <div className="w-20 flex-shrink-0 bg-gray-50 border-r border-gray-200">
              {/* Header space for professional names */}
              {isProfessionalBased && professionals.length > 0 && (
                <div className="h-12 border-b border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-500">Hora</span>
                </div>
              )}
              
              {/* Time slots */}
              <div className="space-y-0">
                {timeSlots.map((slot) => (
                  <div key={`${slot.hour}-${slot.minute}`} className="h-12 flex items-start justify-end pr-3 py-1">
                    {slot.minute === 0 && (
                      <span className="text-xs text-gray-600 font-medium">
                        {slot.displayTime}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Professional columns or single appointments column */}
            {isProfessionalBased && professionals.length > 0 ? (
              // Professional-based layout with multiple columns
              <div 
                className="flex-1 grid border-r border-gray-200" 
                style={{ gridTemplateColumns: `repeat(${professionals.length}, 1fr)` }}
              >
                {professionals.map((professional: Professional, professionalIndex: number) => (
                  <div key={professional.id} className={`relative ${professionalIndex > 0 ? 'border-l border-gray-200' : ''}`}>
                    {/* Professional header */}
                    <div className="h-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-center px-2">
                      <div className="flex items-center space-x-2">
                        {professional.photo && (
                          <img 
                            src={professional.photo} 
                            alt={professional.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {professional.name}
                        </span>
                      </div>
                    </div>

                    {/* Time slot grid for this professional */}
                    <div className="relative">
                      {timeSlots.map((slot) => {
                        // Check if there's an appointment at this time for this professional
                        const hasAppointment = dayAppointments.some(apt => 
                          apt.professionalId === professional.id &&
                          apt.startTime <= slot.time &&
                          apt.endTime > slot.time
                        );
                        
                        return (
                          <div
                            key={`${slot.hour}-${slot.minute}`}
                            className={`h-12 relative group cursor-pointer hover:bg-blue-50 transition-colors ${
                              slot.minute === 0 ? 'border-b border-gray-100' : 'border-b border-gray-50'
                            }`}
                            onClick={() => !hasAppointment && handleTimeSlotClick(slot.time, professional.id)}
                          >
                            {/* Add appointment button */}
                            {!hasAppointment && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTimeSlotClick(slot.time, professional.id);
                                  }}
                                >
                                  <PlusIcon className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Current time indicator */}
                      {(() => {
                        const now = new Date();
                        const isToday = selectedDate.toDateString() === now.toDateString();
                        if (isToday) {
                          const currentHour = now.getHours();
                          const currentMinute = now.getMinutes();
                          const currentSlotIndex = timeSlots.findIndex(slot => 
                            slot.hour === currentHour && Math.abs(slot.minute - currentMinute) <= 15
                          );
                          if (currentSlotIndex !== -1) {
                            const position = currentSlotIndex * 48 + (currentMinute % 30) * 1.6;
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

                      {/* Appointments for this professional with overlap handling */}
                      {(() => {
                        // Filter appointments for this professional
                        const professionalAppointments = dayAppointments.filter(appointment => {
                          const matches = appointment.professionalId === professional.id;
                          console.log(`🔧 Professional filter for ${professional.name}:`, {
                            appointmentId: appointment.id,
                            appointmentTitle: appointment.title,
                            appointmentProfessionalId: appointment.professionalId,
                            expectedProfessionalId: professional.id,
                            matches
                          });
                          return matches;
                        });

                        // Group overlapping appointments for this professional
                        const appointmentGroups = groupOverlappingAppointments(professionalAppointments);
                        
                        console.log(`🔧 Professional ${professional.name} appointment groups:`, {
                          totalAppointments: professionalAppointments.length,
                          groups: appointmentGroups.map((group, index) => ({
                            groupIndex: index,
                            appointmentCount: group.length,
                            appointments: group.map(apt => ({
                              id: apt.id,
                              title: apt.title,
                              startTime: apt.startTime,
                              endTime: apt.endTime
                            }))
                          }))
                        });
                        
                        return appointmentGroups.flat();
                      })()
                        .map((appointment) => {
                          // Find which group this appointment belongs to (for this professional)
                          const professionalAppointments = dayAppointments.filter(apt => 
                            apt.professionalId === professional.id
                          );
                          const appointmentGroups = groupOverlappingAppointments(professionalAppointments);
                          const groupAppointments = appointmentGroups.find(group => 
                            group.some(apt => apt.id === appointment.id)
                          ) || [appointment];
                          
                          // Calculate layout for this appointment
                          const layout = calculateAppointmentLayout(appointment, groupAppointments, isMobile);
                          
                          // Calculate precise positioning based on actual time
                          const position = calculateAppointmentPosition(appointment, timeSlots);
                          
                          console.log('🔧 Rendering professional appointment:', {
                            appointmentId: appointment.id,
                            professionalName: professional.name,
                            startPosition: position.startPosition,
                            height: position.height,
                            startTime: appointment.startTime,
                            endTime: appointment.endTime,
                            layout: layout,
                            appointmentData: appointment
                          });
                          
                          // Final verification before rendering
                          console.log(`🔧 FINAL HEIGHT CHECK - ${appointment.id}: ${position.height}px (${appointment.startTime} - ${appointment.endTime})`);
                          
                          return (
                            <div
                              key={appointment.id}
                              className="absolute z-20"
                              style={{
                                top: `${position.startPosition + 2}px`,
                                height: `${position.height}px`,
                                left: layout.leftOffset,
                                width: layout.width,
                                zIndex: layout.zIndex
                              }}
                              data-appointment-id={appointment.id}
                              data-height={position.height}
                              data-start-time={appointment.startTime}
                              data-end-time={appointment.endTime}
                            >
                              <AppointmentTooltip appointment={appointment}>
                                <div 
                                  className={`
                                    h-full rounded-lg border-l-4 backdrop-blur-sm cursor-pointer transition-all duration-300 
                                    hover:scale-[1.02] hover:shadow-lg group relative overflow-hidden
                                    ${getAppointmentColor(appointment.status)}
                                    ${layout.totalInGroup > 1 ? (isMobile ? 'p-1' : 'p-1') : (isMobile ? 'p-2' : 'p-2')}
                                  `}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                  
                                  <div className="relative z-10 h-full flex flex-col">
                                    <div className={`flex items-start justify-between ${isMobile && layout.totalInGroup > 1 ? 'mb-0.5' : 'mb-1'}`}>
                                      <h4 className={`
                                        font-semibold text-gray-900 leading-tight truncate pr-1
                                        ${layout.totalInGroup > 2 ? (isMobile ? 'text-xs' : 'text-xs') : layout.totalInGroup > 1 ? (isMobile ? 'text-xs' : 'text-xs') : (isMobile ? 'text-xs' : 'text-sm')}
                                      `}>
                                        {appointment.title}
                                      </h4>
                                      {(isMobile ? layout.totalInGroup <= 1 : layout.totalInGroup <= 2) && (
                                        <span className={`
                                          px-1.5 py-0.5 text-xs font-medium rounded-full shrink-0 
                                          ${getStatusColor(appointment.status)}
                                          shadow-sm
                                        `}>
                                          {getStatusText(appointment.status)}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className={`flex-1 ${layout.totalInGroup > 2 ? (isMobile ? 'space-y-0.5' : 'space-y-0.5') : isMobile ? 'space-y-0.5' : 'space-y-1'}`}>
                                      <div className={`flex items-center text-gray-700 ${layout.totalInGroup > 2 ? (isMobile ? 'text-xs' : 'text-xs') : (isMobile ? 'text-xs' : 'text-xs')}`}>
                                        <ClockIcon className={`mr-1 text-gray-500 ${layout.totalInGroup > 2 ? 'h-3 w-3' : 'h-3 w-3'}`} />
                                        <span className="font-medium">{appointment.startTime} - {appointment.endTime}</span>
                                      </div>
                                      
                                      <div className={`flex items-center text-gray-700 ${layout.totalInGroup > 2 ? (isMobile ? 'text-xs' : 'text-xs') : (isMobile ? 'text-xs' : 'text-xs')}`}>
                                        <UserIcon className={`mr-1 text-gray-500 ${layout.totalInGroup > 2 ? 'h-3 w-3' : 'h-3 w-3'}`} />
                                        <span className="truncate">{appointment.client}</span>
                                      </div>
                                      
                                      {/* Show status for compressed appointments */}
                                      {(isMobile ? layout.totalInGroup > 1 : layout.totalInGroup > 2) && (
                                        <div className="flex items-center">
                                          <span className={`
                                            px-1 py-0.5 text-xs font-medium rounded shrink-0 
                                            ${getStatusColor(appointment.status)}
                                          `}>
                                            {getStatusText(appointment.status)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </AppointmentTooltip>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Single column layout for resource-based or when no professionals
              <div className="flex-1 relative border-r border-gray-200">
                {/* Time slot grid */}
                <div className="space-y-0">
                  {timeSlots.map((slot) => {
                    // Count appointments at this time slot
                    const appointmentsAtTime = dayAppointments.filter(apt => 
                      timeToMinutes(apt.startTime) <= timeToMinutes(slot.time) &&
                      timeToMinutes(apt.endTime) > timeToMinutes(slot.time)
                    );
                    
                    const hasAppointment = appointmentsAtTime.length > 0;
                    
                    return (
                      <div
                        key={`${slot.hour}-${slot.minute}`}
                        className={`h-12 relative group cursor-pointer hover:bg-blue-50 transition-colors ${
                          slot.minute === 0 ? 'border-b border-gray-100' : 'border-b border-gray-50'
                        }`}
                        onClick={() => !hasAppointment && handleTimeSlotClick(slot.time)}
                      >
                        {/* Add appointment button */}
                        {!hasAppointment && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTimeSlotClick(slot.time);
                              }}
                            >
                              <PlusIcon className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Current time indicator */}
                {(() => {
                  const now = new Date();
                  const isToday = selectedDate.toDateString() === now.toDateString();
                  if (isToday) {
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();
                    const currentSlotIndex = timeSlots.findIndex(slot => 
                      slot.hour === currentHour && Math.abs(slot.minute - currentMinute) <= 15
                    );
                    if (currentSlotIndex !== -1) {
                      const position = currentSlotIndex * 48 + (currentMinute % 30) * 1.6;
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

                {/* Appointments with overlap handling */}
                {(() => {
                  // Group overlapping appointments
                  const appointmentGroups = groupOverlappingAppointments(dayAppointments);
                  
                  console.log('🔧 Single column appointment groups:', {
                    totalAppointments: dayAppointments.length,
                    groups: appointmentGroups.map((group, index) => ({
                      groupIndex: index,
                      appointmentCount: group.length,
                      appointments: group.map(apt => ({
                        id: apt.id,
                        title: apt.title,
                        startTime: apt.startTime,
                        endTime: apt.endTime
                      }))
                    }))
                  });
                  
                  return appointmentGroups.flat().map((appointment) => {
                    // Find which group this appointment belongs to
                    const groupAppointments = appointmentGroups.find(group => 
                      group.some(apt => apt.id === appointment.id)
                    ) || [appointment];
                    
                    // Calculate layout for this appointment
                    const layout = calculateAppointmentLayout(appointment, groupAppointments, isMobile);
                    
                    // Calculate precise positioning based on actual time
                    const position = calculateAppointmentPosition(appointment, timeSlots);
                    
                    console.log('🔧 Rendering single column appointment:', {
                      id: appointment.id,
                      title: appointment.title,
                      startTime: appointment.startTime,
                      endTime: appointment.endTime,
                      startPosition: position.startPosition,
                      height: position.height,
                      layout: layout
                    });
                    
                    // Final verification before rendering
                    console.log(`🔧 FINAL HEIGHT CHECK SINGLE - ${appointment.id}: ${position.height}px (${appointment.startTime} - ${appointment.endTime})`);
                    
                    return (
                      <div
                        key={appointment.id}
                        className="absolute"
                        style={{
                          top: `${position.startPosition + 2}px`,
                          height: `${position.height}px`,
                          left: layout.leftOffset,
                          width: layout.width,
                          zIndex: layout.zIndex
                        }}
                        data-appointment-id={appointment.id}
                        data-height={position.height}
                        data-start-time={appointment.startTime}
                        data-end-time={appointment.endTime}
                      >
                        <AppointmentTooltip appointment={appointment}>
                          <div 
                            className={`
                              h-full rounded-lg border-l-4 backdrop-blur-sm cursor-pointer transition-all duration-300 
                              hover:scale-[1.02] hover:shadow-lg group relative overflow-hidden
                              ${getAppointmentColor(appointment.status)}
                              ${layout.totalInGroup > 1 ? (isMobile ? 'p-1.5' : 'p-2') : (isMobile ? 'p-2.5' : 'p-3')}
                            `}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            
                            <div className="relative z-10 h-full flex flex-col">
                              <div className={`flex items-start justify-between ${isMobile && layout.totalInGroup > 1 ? 'mb-0.5' : 'mb-1'}`}>
                                <h4 className={`
                                  font-semibold text-gray-900 leading-tight truncate pr-1
                                  ${layout.totalInGroup > 2 ? (isMobile ? 'text-xs' : 'text-xs') : layout.totalInGroup > 1 ? (isMobile ? 'text-xs' : 'text-sm') : (isMobile ? 'text-sm' : 'text-sm')}
                                `}>
                                  {appointment.title}
                                </h4>
                                {(isMobile ? layout.totalInGroup <= 1 : layout.totalInGroup <= 2) && (
                                  <span className={`
                                    px-1.5 py-0.5 text-xs font-medium rounded-full shrink-0 
                                    ${getStatusColor(appointment.status)}
                                    shadow-sm
                                  `}>
                                    {getStatusText(appointment.status)}
                                  </span>
                                )}
                              </div>
                              
                              <div className={`flex-1 ${layout.totalInGroup > 2 ? (isMobile ? 'space-y-0.5' : 'space-y-0.5') : isMobile ? 'space-y-0.5' : 'space-y-1'}`}>
                                <div className={`flex items-center text-gray-700 ${layout.totalInGroup > 2 ? (isMobile ? 'text-xs' : 'text-xs') : (isMobile ? 'text-xs' : 'text-sm')}`}>
                                  <ClockIcon className={`mr-1 text-gray-500 ${layout.totalInGroup > 2 ? 'h-3 w-3' : (isMobile ? 'h-3 w-3' : 'h-4 w-4')}`} />
                                  <span className="font-medium">{appointment.startTime} - {appointment.endTime}</span>
                                </div>
                                
                                <div className={`flex items-center text-gray-700 ${layout.totalInGroup > 2 ? (isMobile ? 'text-xs' : 'text-xs') : (isMobile ? 'text-xs' : 'text-sm')}`}>
                                  <UserIcon className={`mr-1 text-gray-500 ${layout.totalInGroup > 2 ? 'h-3 w-3' : (isMobile ? 'h-3 w-3' : 'h-4 w-4')}`} />
                                  <span className="truncate">{appointment.client}</span>
                                </div>
                                
                                {/* Show status for compressed appointments */}
                                {(isMobile ? layout.totalInGroup > 1 : layout.totalInGroup > 2) && (
                                  <div className="flex items-center">
                                    <span className={`
                                      px-1 py-0.5 text-xs font-medium rounded shrink-0 
                                      ${getStatusColor(appointment.status)}
                                    `}>
                                      {getStatusText(appointment.status)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </AppointmentTooltip>
                      </div>
                    );
                  });
                })()}

                {/* Empty state for single column */}
                {dayAppointments.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No hay citas</h3>
                      <p className="text-xs text-gray-600 mb-3">Sin citas agendadas</p>
                      <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
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

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateAppointment}
        selectedDate={selectedDate}
        selectedTime={selectedTimeSlot?.time}
        selectedProfessionalId={selectedTimeSlot?.professionalId}
        professionals={professionals}
        services={organization?.settings?.services || []}
      />
    </div>
  );
};