import React, { useState, useEffect } from 'react';
import { Calendar, AgendaView } from '@/components/calendar';
import { showToast } from '@/components/ui';
import { useOrganization } from '@/hooks/useOrganization';
import { appointmentService, AppointmentData } from '@/services/appointmentService';
import { 
  PresentationChartBarIcon, 
  UserGroupIcon, 
  ClockIcon, 
  CheckBadgeIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

// Helper function to create consistent date strings without timezone issues
const formatDateForAPI = (date: Date): string => {
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
      return formatDateForAPI(parsedDate);
    }
  } catch (error) {
    console.warn('Unable to parse date string:', dateStr);
  }
  
  return dateStr;
};

// Mock data - removed, now using real data from backend

export const AppointmentsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'agenda'>('agenda');
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [appointmentCounts, setAppointmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { organization } = useOrganization();
  
  // Determine filtering based on organization model
  const appointmentModel = organization?.settings?.appointmentSystem?.appointmentModel;
  const isProfessionalBased = appointmentModel === 'professional_based';
  const isResourceBased = appointmentModel === 'resource_based';
  
  // Get the selected professional or resource if applicable
  // In professional-based mode, we want to load ALL appointments to show in all professional columns
  // Only filter by specific professional/resource if we're in resource-based mode or have a specific selection
  const selectedProfessional = undefined; // Don't filter by professional - we want all appointments
  const selectedResource = isResourceBased
    ? organization?.settings?.appointmentSystem?.resources?.find(r => r.isActive)?.id
    : undefined;

  // Load appointments for the current month and selected date
  useEffect(() => {
    const loadAppointments = async () => {
      if (!organization) return;
      
      try {
        setLoading(true);
        
        // Get appointments for current month for counts
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        
        const monthStartStr = formatDateForAPI(monthStart);
        const monthEndStr = formatDateForAPI(monthEnd);
        
        console.log('🔧 Loading appointments for month:', monthStartStr, 'to', monthEndStr);
        
        // Get appointment counts for calendar
        const counts = await appointmentService.getAppointmentCounts(monthStartStr, monthEndStr);
        setAppointmentCounts(counts);
        
        // Get appointments for selected date
        const selectedDateStr = formatDateForAPI(selectedDate);
        console.log('🔧 Loading appointments for selected date:', selectedDateStr);
        console.log('🔧 API parameters:', {
          date: selectedDateStr,
          selectedProfessional,
          selectedResource,
          isProfessionalBased,
          isResourceBased
        });
        
        const dayAppointments = await appointmentService.getAppointmentsByDate(
          selectedDateStr,
          selectedProfessional,
          selectedResource
        );
        
        console.log('🔧 Loaded appointments for date:', selectedDateStr, dayAppointments.length, 'appointments');
        console.log('🔧 Appointments data:', dayAppointments.map(apt => ({ 
          id: apt.id, 
          date: apt.date, 
          normalizedDate: normalizeDateString(apt.date),
          startTime: apt.startTime, 
          client: apt.client 
        })));
        
        // Additional validation: Filter appointments that match the selected date
        const filteredAppointments = dayAppointments.filter(apt => {
          const normalizedAppointmentDate = normalizeDateString(apt.date);
          const matches = normalizedAppointmentDate === selectedDateStr;
          
          if (!matches) {
            console.warn('🔧 Found appointment with mismatched date:', {
              appointmentId: apt.id,
              expectedDate: selectedDateStr,
              appointmentRawDate: apt.date,
              appointmentNormalizedDate: normalizedAppointmentDate
            });
          }
          
          return matches;
        });
        
        console.log('🔧 Final filtered appointments:', filteredAppointments.length, 'of', dayAppointments.length, 'total');
        setAppointments(filteredAppointments);
      } catch (error) {
        console.error('Error loading appointments:', error);
        showToast.error('Error al cargar las citas', 'No se pudieron cargar las citas. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [selectedDate, organization, selectedProfessional, selectedResource]);

  // Filter appointments to ensure they match the selected date (double-check for consistency)
  const selectedDateStr = formatDateForAPI(selectedDate);
  const todayAppointments = appointments.filter(apt => {
    const normalizedAppointmentDate = normalizeDateString(apt.date);
    return normalizedAppointmentDate === selectedDateStr;
  });

  // Debug logging to track what's happening with the appointments
  console.log('🔧 AppointmentsPage - Date filtering summary:', {
    selectedDate: selectedDate.toISOString().split('T')[0],
    selectedDateStr,
    totalAppointments: appointments.length,
    filteredAppointments: todayAppointments.length,
    appointmentDates: appointments.map(apt => ({
      id: apt.id,
      rawDate: apt.date,
      normalizedDate: normalizeDateString(apt.date)
    }))

  });

  // Stats for the dashboard cards - calculate from real data
  const totalAppointments = Object.values(appointmentCounts).reduce((sum, count) => sum + count, 0);
  const todayCount = todayAppointments.length;
  const confirmedCount = todayAppointments.filter(a => a.status === 'confirmed').length;
  const completedCount = todayAppointments.filter(a => a.status === 'completed').length;

  const handleNewAppointment = () => {
    showToast.success(
      '¡Cita creada exitosamente!',
      'La nueva cita se ha agregado al calendario. El cliente recibirá una confirmación por email.'
    );
  };

  const handleCreateAppointment = async (appointmentData: any) => {
    try {
      console.log('🔧 Creating appointment:', appointmentData);
      
      // Create the datetime ISO string
      const datetime = new Date(`${appointmentData.date}T${appointmentData.startTime}:00`).toISOString();
      
      // Get service info if available
      const selectedService = organization?.settings?.services?.find(s => s.id === appointmentData.serviceId);
      
      // Prepare the request according to CreateAppointmentRequest interface
      const createRequest = {
        clientInfo: appointmentData.clientInfo,
        serviceInfo: {
          name: appointmentData.title,
          duration: appointmentData.duration,
          price: selectedService?.price || 0
        },
        datetime: datetime,
        duration: appointmentData.duration,
        preferredStaffId: appointmentData.professionalId,
        notes: appointmentData.notes || undefined
      };
      
      // Call the appointment service
      await appointmentService.createAppointment(createRequest);
      
      showToast.success(
        '¡Cita creada exitosamente!',
        `Cita programada para ${appointmentData.clientInfo.name} el ${appointmentData.date} a las ${appointmentData.startTime}`
      );
      
      // Reload appointments to show the new one
      // Force a re-render by setting the selected date
      const currentDate = selectedDate;
      setSelectedDate(new Date(currentDate.getTime() + 1));
      setTimeout(() => setSelectedDate(currentDate), 100);
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      showToast.error(
        'Error al crear la cita',
        'No se pudo crear la cita. Por favor, inténtalo de nuevo.'
      );
    }
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
      <div className="hidden lg:flex h-full flex-col space-y-4 max-h-full overflow-hidden">
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
        <div className="flex-1 grid grid-cols-5 gap-4 min-h-0 overflow-hidden">
          <div className="col-span-2 min-h-0">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              appointments={appointmentCounts}
            />
          </div>
          <div className="col-span-3 min-h-0">
            <AgendaView
              selectedDate={selectedDate}
              appointments={todayAppointments}
              organization={organization}
              onCreateAppointment={handleCreateAppointment}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden h-full flex flex-col pb-20 max-h-full overflow-hidden">
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
          <div className="h-full min-h-0">
            {activeTab === 'agenda' ? (
              <AgendaView
                selectedDate={selectedDate}
                appointments={todayAppointments}
                organization={organization}
                onCreateAppointment={handleCreateAppointment}
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