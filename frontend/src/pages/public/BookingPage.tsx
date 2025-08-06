import React, { useState, useEffect, memo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  publicBookingService,
  PublicOrganization,
  PublicService,
  PublicProfessional,
  AvailabilitySlot,
  DailyAvailabilityCount
} from '@/services/publicBookingService';
import { formatCurrency } from '@/utils/currency';
import { realTimeNotificationService } from '@/services/realTimeNotificationService';

// Helper function to create date from YYYY-MM-DD string without timezone issues
const createLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

// Helper function to format date for display
const formatDisplayDate = (dateString: string): string => {
  const date = createLocalDate(dateString);
  const formatted = date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  console.log('🔧 Date formatting:', { dateString, date, formatted });
  return formatted;
};

type BookingStep = 'services' | 'professional' | 'datetime' | 'details' | 'confirmation';

interface BookingData {
  service?: PublicService;
  professional?: PublicProfessional;
  date?: string;
  time?: string;
  resourceSlot?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  notes?: string;
}

export const BookingPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const [currentStep, setCurrentStep] = useState<BookingStep>('services');
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // API data states
  const [organization, setOrganization] = useState<PublicOrganization | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [professionals, setProfessionals] = useState<PublicProfessional[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load organization data on mount
  useEffect(() => {
    const loadOrganizationData = async () => {
      if (!orgId) {
        setError('ID de organización no válido');
        setIsInitialLoading(false);
        return;
      }

      try {
        console.log('🔄 Loading organization data for:', orgId);
        
        // Load organization, services, and professionals in parallel
        const [orgData, servicesData, professionalsData] = await Promise.all([
          publicBookingService.getOrganization(orgId),
          publicBookingService.getServices(orgId),
          publicBookingService.getProfessionals(orgId),
        ]);

        setOrganization(orgData);
        setServices(servicesData);
        setProfessionals(professionalsData);
        
        console.log('✅ Organization data loaded successfully');
        console.log('Organization:', orgData);
        console.log('Services:', servicesData.length);
        console.log('Professionals:', professionalsData.length);
        
      } catch (error: any) {
        console.error('❌ Error loading organization data:', error);
        setError(error.message);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadOrganizationData();
  }, [orgId]);

  // Set document title for SEO
  useEffect(() => {
    if (organization?.name) {
      document.title = `Reservar cita - ${organization.name} | BookFlow`;
      
      // Set meta description
      const metaDescription = document.querySelector('meta[name="description"]') ||
                             document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', `Reserva tu cita en ${organization.name}. Sistema de reservas online fácil y rápido.`);
      if (!document.querySelector('meta[name="description"]')) {
        document.head.appendChild(metaDescription);
      }
    }
  }, [organization?.name]);

  const isProfessionalBased = organization?.settings.appointmentSystem?.appointmentModel === 'professional_based';
  const isResourceBased = organization?.settings.appointmentSystem?.appointmentModel === 'resource_based';
  const maxResources = organization?.settings.appointmentSystem?.maxResources || 1;
  
  // Debug organization settings
  console.log('🔧 Organization settings:', {
    appointmentModel: organization?.settings.appointmentSystem?.appointmentModel,
    maxResources: organization?.settings.appointmentSystem?.maxResources,
    isResourceBased,
    finalMaxResources: maxResources
  });

  const handleServiceSelect = (service: PublicService) => {
    setBookingData(prev => ({ ...prev, service }));
    
    // If professional-based system, go to professional selection first
    if (isProfessionalBased) {
      setCurrentStep('professional');
    } else {
      // For resource-based systems, go directly to datetime
      setCurrentStep('datetime');
    }
  };

  const handleProfessionalSelect = (professional: PublicProfessional) => {
    setBookingData(prev => ({ ...prev, professional }));
    setCurrentStep('datetime');
  };

  const handleDateTimeSelect = (data: { professional?: PublicProfessional; date: string; time: string; resourceSlot?: string }) => {
    setBookingData(prev => ({ ...prev, ...data }));
    setCurrentStep('details');
  };

  const handleDetailsSubmit = async (details: { clientName: string; clientPhone: string; clientEmail: string; notes?: string }) => {
    setBookingData(prev => ({ ...prev, ...details }));
    setCurrentStep('confirmation');
    
    // Submit booking to API
    setIsLoading(true);
    try {
      if (!orgId || !bookingData.service || !bookingData.date || !bookingData.time) {
        throw new Error('Datos de reserva incompletos');
      }

      const appointmentData = {
        serviceId: bookingData.service.id,
        professionalId: bookingData.professional?.id,
        date: bookingData.date,
        time: bookingData.time,
        clientName: details.clientName,
        clientPhone: details.clientPhone,
        clientEmail: details.clientEmail,
        notes: details.notes || '',
        status: 'pending' as const, // ✅ Nueva cita siempre inicia como pendiente
      };

      const result = await publicBookingService.createAppointment(orgId, appointmentData);
      console.log('✅ Appointment created successfully:', result.id);
      
      // Enviar notificación en tiempo real a los administradores de la organización
      realTimeNotificationService.notifyAppointmentCreated({
        appointmentId: result.id,
        clientName: details.clientName,
        serviceName: bookingData.service.name,
        professionalName: bookingData.professional?.name,
        date: bookingData.date,
        time: bookingData.time,
        orgId: orgId,
      });
      
    } catch (error: any) {
      console.error('❌ Error creating appointment:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case 'professional':
        setCurrentStep('services');
        break;
      case 'datetime':
        if (isProfessionalBased) {
          setCurrentStep('professional');
        } else {
          setCurrentStep('services');
        }
        break;
      case 'details':
        setCurrentStep('datetime');
        break;
      case 'confirmation':
        // Reset everything for a new booking
        setBookingData({});
        setCurrentStep('services');
        break;
    }
  };

  // Show loading state
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cargando...</h3>
          <p className="text-sm text-gray-600">Obteniendo información de la organización</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-sm text-gray-600 mb-4">
            {error || 'No se pudo cargar la información de la organización'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Enhanced Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-gray-100/80 sticky top-0 z-50 shadow-sm">
        <div className="max-w-lg mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {currentStep !== 'services' && (
              <button
                onClick={goBack}
                className="p-2.5 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-105 group"
                aria-label="Volver al paso anterior"
                role="button"
                tabIndex={0}
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
              </button>
            )}
            
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <SparklesIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {organization.name}
                </h1>
              </div>
              <p className="text-xs text-gray-500 font-medium tracking-wide" role="banner">
                Reserva tu cita
              </p>
            </div>
            
            {currentStep !== 'services' && <div className="w-10" />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto overflow-hidden">
        <div className="h-[calc(100vh-90px)] flex flex-col overflow-hidden">
          {/* Enhanced Progress Steps */}
          {currentStep !== 'confirmation' && (
            <div className="px-6 py-6">
              <div className="relative">
                {/* Progress Background Line */}
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 rounded-full" />
                <div className="absolute top-3 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out" 
                     style={{
                       width: currentStep === 'services' ? '0%' : 
                              currentStep === 'professional' ? '33%' : 
                              currentStep === 'datetime' ? (isProfessionalBased ? '66%' : '50%') : 
                              '100%'
                     }} />
                
                <div className="relative flex items-center justify-between">
                  <StepIndicator 
                    isActive={currentStep === 'services'} 
                    isCompleted={currentStep !== 'services'}
                    label="Servicio"
                  />
                  
                  {isProfessionalBased && (
                    <StepIndicator 
                      isActive={currentStep === 'professional'} 
                      isCompleted={currentStep === 'datetime' || currentStep === 'details'}
                      label="Profesional"
                    />
                  )}
                  
                  <StepIndicator 
                    isActive={currentStep === 'datetime'} 
                    isCompleted={currentStep === 'details'}
                    label="Fecha"
                  />
                  
                  <StepIndicator 
                    isActive={currentStep === 'details'} 
                    isCompleted={false}
                    label="Datos"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Animated Step Content */}
          <div className="flex-1 px-6 pb-6 relative overflow-hidden">
            <div className="h-full overflow-hidden">
              <AnimatedStepContent currentStep={currentStep}>
                {currentStep === 'services' && (
                  <ServiceSelection 
                    services={services}
                    organization={organization}
                    onServiceSelect={handleServiceSelect}
                  />
                )}
                
                {currentStep === 'professional' && bookingData.service && (
                  <ProfessionalSelection
                    service={bookingData.service}
                    professionals={professionals}
                    onProfessionalSelect={handleProfessionalSelect}
                  />
                )}
                
                {currentStep === 'datetime' && bookingData.service && (
                  <DateTimeSelection
                    service={bookingData.service}
                    organization={organization}
                    isProfessionalBased={isProfessionalBased}
                    isResourceBased={isResourceBased}
                    maxResources={maxResources}
                    professionals={professionals}
                    selectedProfessional={bookingData.professional}
                    onDateTimeSelect={handleDateTimeSelect}
                    orgId={orgId!}
                  />
                )}
                
                {currentStep === 'details' && (
                  <ClientDetails
                    bookingData={bookingData}
                    organization={organization}
                    onSubmit={handleDetailsSubmit}
                  />
                )}
                
                {currentStep === 'confirmation' && (
                  <BookingConfirmation
                    bookingData={bookingData}
                    organization={organization}
                    isLoading={isLoading}
                    onNewBooking={() => {
                      setBookingData({});
                      setCurrentStep('services');
                    }}
                  />
                )}
              </AnimatedStepContent>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Professional Selection Component
const ProfessionalSelection: React.FC<{
  service: PublicService;
  professionals: PublicProfessional[];
  onProfessionalSelect: (professional: PublicProfessional) => void;
}> = memo(({ service, professionals, onProfessionalSelect }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
          Selecciona un profesional
        </h2>
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
          <p className="text-blue-800 font-medium text-sm mb-1">Servicio: {service.name}</p>
          <p className="text-blue-600 text-xs">Elige el profesional que prefieras</p>
        </div>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto flex flex-col items-center">
        {professionals.map((professional, index) => (
          <button
            key={professional.id}
            onClick={() => onProfessionalSelect(professional)}
            className="w-[85%] mx-auto px-4 py-5 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 text-left group hover:scale-[1.01] active:scale-[0.99]"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center space-x-4">
              {professional.photo ? (
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-300">
                  <img
                    src={professional.photo}
                    alt={professional.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-300">
                  <UserIcon className="h-7 w-7 text-blue-600" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg mb-1">
                  {professional.name}
                </h3>
                <p className="text-gray-500 text-sm">Profesional disponible</p>
              </div>
              <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ArrowLeftIcon className="h-5 w-5 rotate-180" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

// Service Selection Component
const ServiceSelection: React.FC<{
  services: PublicService[];
  organization: PublicOrganization;
  onServiceSelect: (service: PublicService) => void;
}> = memo(({ services, organization, onServiceSelect }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
          Selecciona un servicio
        </h2>
        <p className="text-gray-600">Elige el servicio que deseas reservar</p>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto flex flex-col items-center">
        {services.map((service, index) => (
          <button
            key={service.id}
            onClick={() => onServiceSelect(service)}
            className="w-[85%] mx-auto px-4 py-5 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 text-left group hover:scale-[1.01] active:scale-[0.99]"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg mb-1">
                  {service.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  {service.description}
                </p>
              </div>
              <div className="ml-4 text-right">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  {formatCurrency(service.price, organization.currency || organization.settings?.currency || 'CLP')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 mr-2 text-blue-400" />
                <span className="font-medium">{service.duration} minutos</span>
              </div>
              <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ArrowLeftIcon className="h-4 w-4 rotate-180" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

// Date Time Selection Component
const DateTimeSelection: React.FC<{
  service: PublicService;
  organization: PublicOrganization;
  isProfessionalBased: boolean;
  isResourceBased: boolean;
  maxResources: number;
  professionals: PublicProfessional[];
  selectedProfessional?: PublicProfessional;
  onDateTimeSelect: (data: { professional?: PublicProfessional; date: string; time: string; resourceSlot?: string }) => void;
  orgId: string;
}> = ({ service, organization, isProfessionalBased, isResourceBased, maxResources, professionals, selectedProfessional, onDateTimeSelect, orgId }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [dailyAvailability, setDailyAvailability] = useState<DailyAvailabilityCount[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);

  // Get effective schedule (professional's custom schedule or business hours)
  const getEffectiveSchedule = () => {
    if (selectedProfessional?.schedule) {
      // Professional has custom schedule
      console.log('🔧 Using professional custom schedule:', selectedProfessional.schedule);
      return selectedProfessional.schedule;
    }
    // Use business hours as fallback
    console.log('🔧 Using business hours:', organization.settings.businessHours);
    return organization.settings.businessHours;
  };

  // Generate next 7 days based on effective schedule (excluding past dates)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    const effectiveSchedule = getEffectiveSchedule();
    
    console.log('🔧 Getting available dates...');
    console.log('🔧 Effective schedule:', effectiveSchedule);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Create date string in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      if (dateString < todayString) {
        console.log(`🔧 Skipping past date: ${dateString}`);
        continue;
      }
      
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
      // Map Spanish day names to English keys (matching businessHours structure)
      const dayMapping: Record<string, string> = {
        'lunes': 'monday',
        'martes': 'tuesday', 
        'miércoles': 'wednesday',
        'jueves': 'thursday',
        'viernes': 'friday',
        'sábado': 'saturday',
        'domingo': 'sunday'
      };
      const dayKey = dayMapping[dayName.toLowerCase()] || dayName.toLowerCase();
      const scheduleDay = effectiveSchedule[dayKey];
      
      console.log(`🔧 Day ${i}: ${dayName} (${dayKey}) - Schedule:`, scheduleDay);
      
      if (scheduleDay?.isOpen) {
        const dateData = {
          date: dateString,
          display: date.toLocaleDateString('es-ES', { 
            weekday: 'short', 
            day: 'numeric',
            month: 'short'
          }),
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          isToday: dateString === todayString
        };
        console.log('🔧 Adding available date:', dateData);
        dates.push(dateData);
      } else {
        console.log(`🔧 Day ${dayName} is closed or undefined`);
      }
    }
    
    console.log('🔧 Final available dates:', dates);
    return dates;
  };

  // Load daily availability counts when component mounts or professional changes
  useEffect(() => {
    const loadDailyAvailability = async () => {
      const availableDates = getAvailableDates();
      const dateStrings = availableDates.map(d => d.date);
      
      if (dateStrings.length === 0) return;

      setIsLoadingDaily(true);
      try {
        const dailyCounts = await publicBookingService.getDailyAvailabilityCounts(
          orgId,
          dateStrings,
          service.duration,
          selectedProfessional?.id
        );
        setDailyAvailability(dailyCounts);
      } catch (error: any) {
        console.warn('Could not load daily availability counts, using fallback:', error.message);
        // Keep dailyAvailability empty to trigger fallback behavior
        setDailyAvailability([]);
      } finally {
        setIsLoadingDaily(false);
      }
    };

    loadDailyAvailability();
  }, [orgId, service.duration, selectedProfessional]);

  // Reset selected date when professional changes (schedule might be different)
  useEffect(() => {
    setSelectedDate('');
    setSelectedTime('');
  }, [selectedProfessional]);

  // Generate multiple slots for resource-based systems
  const generateResourceSlots = (baseSlots: AvailabilitySlot[]) => {
    console.log('🔧 generateResourceSlots:', {
      isResourceBased,
      maxResources,
      baseSlotsCount: baseSlots.length,
      expectedTotal: isResourceBased ? baseSlots.length * maxResources : baseSlots.length
    });
    
    if (!isResourceBased) {
      console.log('🔧 Not resource-based, returning original slots');
      return baseSlots;
    }

    const resourceSlots: AvailabilitySlot[] = [];
    
    baseSlots.forEach((slot, index) => {
      // IMPORTANT: Always use configured maxResources, ignore backend availableCount
      // Backend might return incorrect availableCount, but we want to respect user's configuration
      const availableResources = Math.min(slot.availableCount || maxResources, maxResources);
      
      console.log(`🔧 Processing slot ${index} (${slot.time}):`, {
        slotAvailableCount: slot.availableCount,
        maxResources,
        finalAvailableResources: availableResources,
        willGenerate: availableResources + ' slots',
        note: 'Using min of availableCount and maxResources'
      });
      
      // Generate individual slots for each available resource
      for (let i = 0; i < availableResources; i++) {
        resourceSlots.push({
          ...slot,
          time: slot.time,
          available: slot.available,
          resourceSlot: i + 1, // Add resource slot identifier
          totalResourceSlots: availableResources,
          availableCount: 1 // Each individual slot represents 1 resource
        });
      }
    });
    
    console.log(`🔧 Generated ${resourceSlots.length} resource slots from ${baseSlots.length} base slots`);
    return resourceSlots;
  };

  // Load availability slots when date changes
  useEffect(() => {
    const loadAvailability = async () => {
      if (!selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const baseSlots = await publicBookingService.getAvailability(
          orgId,
          selectedDate,
          service.duration,
          selectedProfessional?.id
        );
        
        // Filter out past time slots if the selected date is today
        const now = new Date();
        const selectedDateObj = createLocalDate(selectedDate);
        const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isToday = selectedDate === todayString;
        
        const filteredSlots = isToday ? baseSlots.filter(slot => {
          // Parse slot time (format: "HH:MM")
          const [hours, minutes] = slot.time.split(':').map(Number);
          const slotDateTime = new Date(now);
          slotDateTime.setHours(hours, minutes, 0, 0);
          
          // Only show slots that are at least 30 minutes in the future
          const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
          return slotDateTime > thirtyMinutesFromNow;
        }) : baseSlots;
        
        console.log('🔧 Base slots:', baseSlots.length);
        if (isToday) {
          console.log('🔧 Filtered past slots, remaining:', filteredSlots.length);
        }
        
        // For resource-based systems, generate multiple slots per hour
        const finalSlots = generateResourceSlots(filteredSlots);
        setAvailableSlots(finalSlots);
        
        console.log('🔧 Final slots:', finalSlots.length);
      } catch (error: any) {
        console.error('Error loading availability:', error);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadAvailability();
  }, [selectedDate, selectedProfessional, orgId, service.duration, isResourceBased, maxResources]);

  const availableDates = getAvailableDates();

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return;
    
    // For grouped slots, selectedTime is just the time (e.g., "09:00")
    // We need to find the first available slot for this time
    const availableSlotsForTime = availableSlots.filter(
      slot => slot.time === selectedTime && slot.available
    );
    
    const firstAvailableSlot = availableSlotsForTime[0];
    const resourceSlot = isResourceBased && firstAvailableSlot?.resourceSlot ? 
      firstAvailableSlot.resourceSlot.toString() : 
      undefined;
    
    console.log('🔧 Continue with:', {
      selectedTime,
      availableSlotsForTime: availableSlotsForTime.length,
      resourceSlot,
      isResourceBased
    });
    
    onDateTimeSelect({
      professional: selectedProfessional,
      date: selectedDate,
      time: selectedTime,
      resourceSlot: resourceSlot
    });
  };

  const getDailyAvailabilityCount = (date: string) => {
    const dayAvailability = dailyAvailability.find(d => d.date === date);
    return dayAvailability?.availableSlots || 0;
  };

  const isDateAvailable = (date: string) => {
    // If daily availability was loaded successfully, use those counts
    if (dailyAvailability.length > 0) {
      const availableCount = getDailyAvailabilityCount(date);
      
      // For today, check if there are available slots considering current time
      const now = new Date();
      const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      if (date === todayString && availableCount > 0) {
        // Additional check: ensure there are actually future slots available today
        // This prevents showing "available" when all slots are in the past
        const effectiveSchedule = getEffectiveSchedule();
        const dateObj = createLocalDate(date);
        const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
        const dayMapping: Record<string, string> = {
          'lunes': 'monday',
          'martes': 'tuesday', 
          'miércoles': 'wednesday',
          'jueves': 'thursday',
          'viernes': 'friday',
          'sábado': 'saturday',
          'domingo': 'sunday'
        };
        const dayKey = dayMapping[dayName.toLowerCase()] || dayName.toLowerCase();
        const scheduleDay = effectiveSchedule[dayKey];
        
        if (scheduleDay?.isOpen) {
          // Check if business hours haven't ended yet
          const [endHour] = scheduleDay.closeTime.split(':').map(Number);
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTimeInMinutes = currentHour * 60 + currentMinute;
          const closeTimeInMinutes = endHour * 60;
          
          // Allow booking if there's at least 30 minutes before closing
          return currentTimeInMinutes < (closeTimeInMinutes - 30);
        }
        return false;
      }
      
      return availableCount > 0;
    }
    
    // Fallback: check if the date has availability based on effective schedule
    const dateObj = createLocalDate(date);
    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
    // Map Spanish day names to English keys
    const dayMapping: Record<string, string> = {
      'lunes': 'monday',
      'martes': 'tuesday', 
      'miércoles': 'wednesday',
      'jueves': 'thursday',
      'viernes': 'friday',
      'sábado': 'saturday',
      'domingo': 'sunday'
    };
    const dayKey = dayMapping[dayName.toLowerCase()] || dayName.toLowerCase();
    const effectiveSchedule = getEffectiveSchedule();
    const scheduleDay = effectiveSchedule[dayKey];
    return scheduleDay?.isOpen || false;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
          Selecciona fecha y hora
        </h2>
        <div className="space-y-3">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <p className="text-blue-800 font-bold text-sm mb-1">Servicio: {service.name}</p>
            <div className="flex items-center space-x-4 text-xs text-blue-600">
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-3 w-3" />
                <span>{service.duration} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-semibold">{formatCurrency(service.price, organization?.currency || 'CLP')}</span>
              </div>
            </div>
          </div>
          
          {selectedProfessional && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100">
              <div className="flex items-center space-x-2 mb-2">
                <UserIcon className="h-4 w-4 text-green-600" />
                <p className="text-green-800 font-bold text-sm">Profesional: {selectedProfessional.name}</p>
              </div>
              {selectedProfessional.schedule ? (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Horarios personalizados disponibles
                </p>
              ) : (
                <p className="text-xs text-green-600">
                  Horarios generales del negocio
                </p>
              )}
            </div>
          )}
          
          {isResourceBased && (
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
              <p className="text-xs text-purple-700 font-medium">
                Sistema de recursos • Máximo {maxResources} {maxResources === 1 ? 'recurso' : 'recursos'} simultáneos
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">

        {/* Date Selection */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
            <span>Fecha</span>
          </h3>
          {isLoadingDaily ? (
            <div className="flex items-center justify-center py-4" role="status" aria-live="polite">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
              <span className="ml-2 text-sm text-gray-600">Cargando fechas...</span>
              <span className="sr-only">Cargando fechas disponibles</span>
            </div>
          ) : availableDates.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">No hay fechas disponibles</p>
              <p className="text-xs text-gray-500">
                {selectedProfessional ? 
                  `${selectedProfessional.name} no tiene horarios configurados` :
                  'No hay horarios de negocio configurados'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              {availableDates.map((dateOption, index) => {
                const availableCount = getDailyAvailabilityCount(dateOption.date);
                const hasAvailability = isDateAvailable(dateOption.date);
                const showCount = dailyAvailability.length > 0 && availableCount > 0;
                const isSelected = selectedDate === dateOption.date;
                
                return (
                  <button
                    key={dateOption.date}
                    onClick={() => hasAvailability && setSelectedDate(dateOption.date)}
                    disabled={!hasAvailability}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      isSelected
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg shadow-blue-200'
                        : hasAvailability
                        ? 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                    }`}
                    style={{ animationDelay: `${index * 80}ms` }}
                    aria-label={`Fecha ${dateOption.display} ${hasAvailability ? 'disponible' : 'sin disponibilidad'}`}
                  >
                    <div className="text-center">
                      <div className={`text-xs font-medium mb-1 ${
                        isSelected ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {dateOption.dayName}
                      </div>
                      <div className={`text-sm font-bold mb-2 ${
                        isSelected ? 'text-blue-600' :
                        hasAvailability ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {dateOption.display}
                      </div>
                      {dateOption.isToday && (
                        <div className={`text-xs font-bold px-2 py-1 rounded-full mb-1 ${
                          hasAvailability ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          Hoy
                        </div>
                      )}
                      {showCount && (
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                          isResourceBased && availableCount > Math.floor(maxResources * 0.6) ? 'bg-green-100 text-green-700' :
                          isResourceBased && availableCount > 0 ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {isResourceBased ? 
                            `${availableCount} slot${availableCount !== 1 ? 's' : ''}` :
                            `${availableCount} cita${availableCount !== 1 ? 's' : ''}`
                          }
                        </div>
                      )}
                      {!hasAvailability && (
                        <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded-full">
                          Sin citas
                        </div>
                      )}
                      {hasAvailability && !showCount && (
                        <div className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-100 rounded-full">
                          Disponible
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-blue-500" />
              <span>Hora disponible</span>
            </h3>
            
            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                <div className="relative">
                  <div className="w-8 h-8 border-3 border-blue-200 rounded-full animate-pulse" aria-hidden="true"></div>
                  <div className="absolute inset-0 w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                </div>
                <span className="ml-3 text-gray-600 font-medium">Cargando horarios...</span>
                <span className="sr-only">Cargando horarios disponibles</span>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                {(() => {
                  // Group slots by time
                  const groupedSlots = availableSlots.reduce((acc, slot) => {
                    const time = slot.time;
                    if (!acc[time]) {
                      acc[time] = [];
                    }
                    acc[time].push(slot);
                    return acc;
                  }, {} as Record<string, typeof availableSlots>);

                  // Create time slot buttons with availability counts
                  return Object.entries(groupedSlots).map(([time, slots], index) => {
                    const availableCount = slots.filter(slot => slot.available).length;
                    const totalCount = slots.length;
                    const hasAvailable = availableCount > 0;
                    const isSelected = selectedTime === time;
                    
                    console.log(`🔧 Time slot ${time}:`, {
                      availableCount,
                      totalCount,
                      hasAvailable,
                      isResourceBased
                    });
                    
                    return (
                      <button
                        key={time}
                        onClick={() => hasAvailable && setSelectedTime(time)}
                        disabled={!hasAvailable}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                          isSelected
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg shadow-blue-200'
                            : hasAvailable
                            ? 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        aria-label={`Horario ${time} ${hasAvailable ? 'disponible' : 'ocupado'}`}
                      >
                        <div className="text-center">
                          <div className={`text-sm font-bold mb-1 ${
                            isSelected ? 'text-blue-600' :
                            hasAvailable ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {time}
                          </div>
                          {hasAvailable && (
                            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                              isResourceBased && availableCount > Math.floor(totalCount * 0.6) ? 'bg-green-100 text-green-700' :
                              isResourceBased && availableCount > 0 ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {isResourceBased ? 
                                `${availableCount} slot${availableCount !== 1 ? 's' : ''}` :
                                'Disponible'
                              }
                            </div>
                          )}
                          {!hasAvailable && (
                            <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded-full">
                              Ocupado
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="text-center py-12" role="status">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ClockIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                </div>
                <p className="text-gray-600 font-medium mb-2">No hay horarios disponibles</p>
                <p className="text-sm text-gray-500">Intenta seleccionar otra fecha</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Continue Button */}
      <div className="pt-6 border-t border-gray-100">
        <button
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:shadow-none"
        >
          <span className="flex items-center justify-center space-x-2">
            <span>Continuar</span>
            {selectedDate && selectedTime && (
              <ArrowLeftIcon className="h-4 w-4 rotate-180" />
            )}
          </span>
        </button>
      </div>
    </div>
  );
};

// Client Details Component
const ClientDetails: React.FC<{
  bookingData: BookingData;
  organization: PublicOrganization;
  onSubmit: (details: { clientName: string; clientPhone: string; clientEmail: string; notes?: string }) => void;
}> = memo(({ bookingData, organization, onSubmit }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'clientEmail':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? '' : 'Email inválido';
      case 'clientPhone':
        const phoneRegex = /^[+]?[0-9\s-()]{8,}$/;
        return phoneRegex.test(value) ? '' : 'Teléfono inválido';
      case 'clientName':
        return value.trim().length >= 2 ? '' : 'Nombre muy corto';
      default:
        return '';
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientPhone || !formData.clientEmail) return;
    
    onSubmit(formData);
  };

  const isFormValid = formData.clientName && formData.clientPhone && formData.clientEmail && 
                     !Object.values(errors).some(error => error);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
          Finalizar reserva
        </h2>
        <p className="text-gray-600">Completa tu información para confirmar la cita</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 space-y-6">
          {/* Enhanced Service Summary */}
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-lg">{bookingData.service?.name}</h3>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                {formatCurrency(bookingData.service?.price || 0, organization.currency || organization.settings?.currency || 'CLP')}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
                <span className="text-gray-700 font-medium">{formatDisplayDate(bookingData.date!)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 text-blue-500" />
                <span className="text-gray-700 font-medium">{bookingData.time} ({bookingData.service?.duration} min)</span>
              </div>
            </div>
            
            {bookingData.professional && (
              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-blue-200">
                <UserIcon className="h-4 w-4 text-blue-500" />
                <span className="text-gray-700 font-medium">Con {bookingData.professional.name}</span>
              </div>
            )}
          </div>

          {/* Enhanced Form Fields */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                  errors.clientName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="Tu nombre completo"
                aria-describedby={errors.clientName ? 'name-error' : undefined}
              />
              {errors.clientName && (
                <p id="name-error" className="text-red-500 text-xs mt-1 font-medium">{errors.clientName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                required
                value={formData.clientPhone}
                onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                  errors.clientPhone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="+34 123 456 789"
                aria-describedby={errors.clientPhone ? 'phone-error' : undefined}
              />
              {errors.clientPhone && (
                <p id="phone-error" className="text-red-500 text-xs mt-1 font-medium">{errors.clientPhone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.clientEmail}
                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                  errors.clientEmail ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="tu@email.com"
                aria-describedby={errors.clientEmail ? 'email-error' : undefined}
              />
              {errors.clientEmail && (
                <p id="email-error" className="text-red-500 text-xs mt-1 font-medium">{errors.clientEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Notas adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                placeholder="Comentarios adicionales para tu cita (opcional)"
              />
            </div>
          </div>
        </div>

        {/* Enhanced Submit Button */}
        <div className="pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:shadow-none"
          >
            <span className="flex items-center justify-center space-x-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Confirmar Reserva</span>
            </span>
          </button>
        </div>
      </form>
    </div>
  );
});

// Booking Confirmation Component
const BookingConfirmation: React.FC<{
  bookingData: BookingData;
  organization: PublicOrganization;
  isLoading: boolean;
  onNewBooking: () => void;
}> = ({ bookingData, organization, isLoading, onNewBooking }) => {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Procesando tu reserva</h3>
          <p className="text-sm text-gray-600">Por favor espera un momento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center border-4 border-green-200 shadow-lg">
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center animate-bounce">
                <SparklesIcon className="h-3 w-3 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
              ¡Reserva confirmada!
            </h2>
            <p className="text-gray-600 mb-2">Tu cita ha sido reservada exitosamente</p>
            <p className="text-xs text-gray-500">ID de reserva: #{Date.now().toString().slice(-8)}</p>
          </div>

          {/* Enhanced Booking Summary */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-500" />
              Detalles de tu cita
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex-1">
                  <span className="text-sm font-medium text-blue-700">Servicio</span>
                  <p className="font-bold text-gray-900">{bookingData.service?.name}</p>
                  <p className="text-xs text-gray-600">{bookingData.service?.duration} minutos</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(bookingData.service?.price || 0, organization.currency || organization.settings?.currency || 'CLP')}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-xl">
                  <span className="text-sm font-medium text-green-700">Fecha</span>
                  <p className="font-bold text-gray-900 text-sm">
                    {formatDisplayDate(bookingData.date!)}
                  </p>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-xl">
                  <span className="text-sm font-medium text-purple-700">Hora</span>
                  <p className="font-bold text-gray-900 text-sm">{bookingData.time}</p>
                </div>
              </div>
              
              {bookingData.professional && (
                <div className="p-3 bg-amber-50 rounded-xl">
                  <span className="text-sm font-medium text-amber-700">Profesional</span>
                  <p className="font-bold text-gray-900">{bookingData.professional.name}</p>
                </div>
              )}
              
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Cliente</span>
                <p className="font-bold text-gray-900">{bookingData.clientName}</p>
                <p className="text-xs text-gray-600">{bookingData.clientEmail}</p>
              </div>
            </div>
          </div>

          {/* Enhanced Contact Info */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl border border-gray-200 p-5 mb-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-slate-600" />
              {organization.name}
            </h3>
            <div className="space-y-3">
              {organization.address && (
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-4 w-4 mt-0.5 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{organization.address}</span>
                </div>
              )}
              {organization.phone && (
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{organization.phone}</span>
                </div>
              )}
              {organization.email && (
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{organization.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Email Confirmation Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <EnvelopeIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Confirmación por email</p>
                <p className="text-xs text-blue-600 mt-1">
                  Recibirás un email de confirmación con todos los detalles en {bookingData.clientEmail}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="p-6 border-t border-gray-100 space-y-3">
        <button
          onClick={onNewBooking}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
          Hacer otra reserva
        </button>
        <button
          onClick={() => window.print()}
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm"
        >
          Imprimir confirmación
        </button>
      </div>
    </div>
  );
};

// Step Indicator Component for Progress
const StepIndicator: React.FC<{
  isActive: boolean;
  isCompleted: boolean;
  label: string;
}> = memo(({ isActive, isCompleted, label }) => (
  <div className="flex flex-col items-center">
    <div className={`
      w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 transform
      ${isActive ? 'bg-blue-500 scale-110 shadow-lg shadow-blue-200' : 
        isCompleted ? 'bg-blue-500' : 'bg-gray-200'}
      ${isActive ? 'ring-4 ring-blue-100' : ''}
    `}>
      {isCompleted && !isActive ? (
        <CheckCircleIcon className="h-3 w-3 text-white" />
      ) : (
        <div className={`w-2 h-2 rounded-full ${
          isActive || isCompleted ? 'bg-white' : 'bg-gray-400'
        }`} />
      )}
    </div>
    <span className={`mt-2 text-xs font-medium transition-colors duration-200 ${
      isActive ? 'text-blue-600' : isCompleted ? 'text-blue-500' : 'text-gray-400'
    }`}>
      {label}
    </span>
  </div>
));

// Animated Step Content Component
const AnimatedStepContent: React.FC<{
  currentStep: BookingStep;
  children: React.ReactNode;
}> = memo(({ currentStep, children }) => (
  <div 
    key={currentStep}
    className="h-full animate-in slide-in-from-right-8 duration-400 ease-out"
  >
    {children}
  </div>
));