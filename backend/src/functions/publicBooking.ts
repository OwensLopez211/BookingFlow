import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../utils/response';
import { 
  getOrganizationById, 
  Organization 
} from '../repositories/organizationRepository';
import { getAppointmentsByOrgAndDate, createAppointment } from '../repositories/appointmentRepository';

// GET /public/organization/{orgId}
export const getPublicOrganization = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const orgId = event.pathParameters?.orgId;
    
    if (!orgId) {
      return createResponse(400, {
        success: false,
        message: 'ID de organización requerido',
      });
    }

    console.log(`📋 Getting public organization data for: ${orgId}`);

    const organization = await getOrganizationById(orgId);
    
    if (!organization) {
      return createResponse(404, {
        success: false,
        message: 'Organización no encontrada',
      });
    }

    // Return only public information needed for booking
    const publicOrganizationData = {
      id: organization.id,
      name: organization.name,
      address: organization.address,
      phone: organization.phone,
      email: organization.email,
      currency: organization.currency,
      settings: {
        timezone: organization.settings.timezone,
        businessHours: organization.settings.businessHours,
        appointmentSystem: {
          appointmentModel: organization.settings.appointmentSystem?.appointmentModel || 'resource_based',
          allowClientSelection: organization.settings.appointmentSystem?.allowClientSelection || false,
          bufferBetweenAppointments: organization.settings.appointmentSystem?.bufferBetweenAppointments || 15,
          maxAdvanceBookingDays: organization.settings.appointmentSystem?.maxAdvanceBookingDays || 30,
          maxResources: organization.settings.appointmentSystem?.maxResources || 1,
          maxProfessionals: organization.settings.appointmentSystem?.maxProfessionals || 1,
        }
      }
    };

    console.log('✅ Public organization data retrieved successfully');

    return createResponse(200, {
      success: true,
      organization: publicOrganizationData,
    });

  } catch (error: any) {
    console.error('❌ Error in getPublicOrganization:', error);
    return createResponse(500, {
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// GET /public/organization/{orgId}/services
export const getPublicServices = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const orgId = event.pathParameters?.orgId;
    
    if (!orgId) {
      return createResponse(400, {
        success: false,
        message: 'ID de organización requerido',
      });
    }

    console.log(`📋 Getting public services for organization: ${orgId}`);

    const organization = await getOrganizationById(orgId);
    
    if (!organization) {
      return createResponse(404, {
        success: false,
        message: 'Organización no encontrada',
      });
    }

    // Get only active services
    const activeServices = (organization.settings.services || [])
      .filter(service => service.isActive !== false)
      .map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
      }));

    console.log(`✅ Found ${activeServices.length} active services`);

    return createResponse(200, {
      success: true,
      services: activeServices,
    });

  } catch (error: any) {
    console.error('❌ Error in getPublicServices:', error);
    return createResponse(500, {
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// GET /public/organization/{orgId}/professionals
export const getPublicProfessionals = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const orgId = event.pathParameters?.orgId;
    
    if (!orgId) {
      return createResponse(400, {
        success: false,
        message: 'ID de organización requerido',
      });
    }

    console.log(`📋 Getting public professionals for organization: ${orgId}`);

    const organization = await getOrganizationById(orgId);
    
    if (!organization) {
      return createResponse(404, {
        success: false,
        message: 'Organización no encontrada',
      });
    }

    // Check if organization uses professional-based system
    const appointmentModel = organization.settings.appointmentSystem?.appointmentModel;
    
    if (appointmentModel !== 'professional_based') {
      return createResponse(200, {
        success: true,
        professionals: [],
        message: 'Esta organización no utiliza sistema basado en profesionales',
      });
    }

    // Get only active professionals
    const activeProfessionals = (organization.settings.appointmentSystem?.professionals || [])
      .filter(professional => professional.isActive)
      .map(professional => ({
        id: professional.id,
        name: professional.name,
        photo: professional.photo,
      }));

    console.log(`✅ Found ${activeProfessionals.length} active professionals`);

    return createResponse(200, {
      success: true,
      professionals: activeProfessionals,
    });

  } catch (error: any) {
    console.error('❌ Error in getPublicProfessionals:', error);
    return createResponse(500, {
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// GET /public/organization/{orgId}/availability/daily-counts
export const getPublicDailyAvailabilityCounts = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const orgId = event.pathParameters?.orgId;
    const professionalId = event.queryStringParameters?.professionalId;
    const datesParam = event.queryStringParameters?.dates;
    const serviceDuration = parseInt(event.queryStringParameters?.serviceDuration || '60');
    
    if (!orgId) {
      return createResponse(400, {
        success: false,
        message: 'ID de organización requerido',
      });
    }

    if (!datesParam) {
      return createResponse(400, {
        success: false,
        message: 'Fechas requeridas',
      });
    }

    const dates = datesParam.split(',');

    console.log(`📋 Getting daily availability counts for org: ${orgId}, professional: ${professionalId}, dates: ${dates.join(', ')}`);

    const organization = await getOrganizationById(orgId);
    
    if (!organization) {
      return createResponse(404, {
        success: false,
        message: 'Organización no encontrada',
      });
    }

    const dailyCounts = [];

    for (const date of dates) {
      const requestDate = new Date(date);
      const dayName = requestDate.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
      
      // Map Spanish day names to English keys for businessHours
      const dayMapping: Record<string, string> = {
        'lunes': 'monday',
        'martes': 'tuesday', 
        'miércoles': 'wednesday',
        'jueves': 'thursday',
        'viernes': 'friday',
        'sábado': 'saturday',
        'domingo': 'sunday'
      };
      const dayKey = dayMapping[dayName] || dayName;
      const businessDay = organization.settings.businessHours[dayKey];

      if (!businessDay?.isOpen) {
        dailyCounts.push({
          date,
          availableSlots: 0
        });
        continue;
      }

      // Get existing appointments for this date
      const existingAppointments = await getAppointmentsByOrgAndDate(orgId, date);
      console.log(`📅 [Daily] Found ${existingAppointments.length} total appointments for ${date}:`, existingAppointments);
      
      // Filter out cancelled appointments
      const activeAppointments = existingAppointments.filter(
        apt => apt.status !== 'cancelled' && apt.status !== 'no_show'
      );
      console.log(`✅ [Daily] ${activeAppointments.length} active appointments after filtering cancelled/no-show`);

      // Generate time slots for this date
      const startTime = businessDay.openTime;
      const endTime = businessDay.closeTime;
      const buffer = organization.settings.appointmentSystem?.bufferBetweenAppointments || 15;

      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      let availableSlotCount = 0;
      const appointmentModel = organization.settings.appointmentSystem?.appointmentModel;

      for (let minutes = startMinutes; minutes + serviceDuration <= endMinutes; minutes += serviceDuration + buffer) {
        const hour = Math.floor(minutes / 60);
        const min = minutes % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        
        // Count existing appointments at this time slot
        const appointmentsAtTime = activeAppointments.filter(apt => {
          // Parse appointment time from datetime string or time field
          const appointmentTime = apt.datetime ? 
            new Date(apt.datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) :
            apt.time; // Fallback to time field if datetime is not available
          
          console.log(`🔍 Comparing appointment time "${appointmentTime}" with slot time "${timeString}"`);
          const matches = appointmentTime === timeString;
          if (matches) {
            console.log(`✅ Found matching appointment at ${timeString}:`, apt);
          }
          return matches;
        });
        
        console.log(`📊 Time slot ${timeString}: Found ${appointmentsAtTime.length} existing appointments from ${activeAppointments.length} total active appointments`);

        if (appointmentModel === 'resource_based') {
          // For resource-based, calculate remaining slots
          const maxResources = organization.settings.appointmentSystem?.maxResources || 1;
          const occupiedSlots = appointmentsAtTime.length;
          const availableAtThisTime = Math.max(0, maxResources - occupiedSlots);
          availableSlotCount += availableAtThisTime;
        } else {
          // For professional-based, check if time slot is available
          if (professionalId) {
            // Check if this specific professional is available
            const professionalBooked = appointmentsAtTime.some(apt => 
              apt.professionalId === professionalId || apt.staffId === professionalId
            );
            if (!professionalBooked) {
              availableSlotCount += 1;
            }
          } else {
            // Check if any professional can take this slot
            const totalProfessionals = organization.settings.appointmentSystem?.maxProfessionals || 1;
            const occupiedSlots = appointmentsAtTime.length;
            const availableAtThisTime = Math.max(0, totalProfessionals - occupiedSlots);
            availableSlotCount += availableAtThisTime > 0 ? 1 : 0;
          }
        }
      }

      dailyCounts.push({
        date,
        availableSlots: availableSlotCount
      });
    }

    console.log(`✅ Generated daily counts for ${dates.length} dates`);

    return createResponse(200, {
      success: true,
      dailyCounts,
    });

  } catch (error: any) {
    console.error('❌ Error in getPublicDailyAvailabilityCounts:', error);
    return createResponse(500, {
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// GET /public/organization/{orgId}/availability
export const getPublicAvailability = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const orgId = event.pathParameters?.orgId;
    const professionalId = event.queryStringParameters?.professionalId;
    const date = event.queryStringParameters?.date;
    const serviceDuration = parseInt(event.queryStringParameters?.serviceDuration || '60');
    
    if (!orgId) {
      return createResponse(400, {
        success: false,
        message: 'ID de organización requerido',
      });
    }

    if (!date) {
      return createResponse(400, {
        success: false,
        message: 'Fecha requerida',
      });
    }

    console.log(`📋 Getting availability for org: ${orgId}, professional: ${professionalId}, date: ${date}`);

    const organization = await getOrganizationById(orgId);
    
    if (!organization) {
      return createResponse(404, {
        success: false,
        message: 'Organización no encontrada',
      });
    }

    // Get business hours for the requested date
    const requestDate = new Date(date);
    const dayName = requestDate.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    
    // Map Spanish day names to English keys for businessHours
    const dayMapping: Record<string, string> = {
      'lunes': 'monday',
      'martes': 'tuesday', 
      'miércoles': 'wednesday',
      'jueves': 'thursday',
      'viernes': 'friday',
      'sábado': 'saturday',
      'domingo': 'sunday'
    };
    const dayKey = dayMapping[dayName] || dayName;
    const businessDay = organization.settings.businessHours[dayKey];

    if (!businessDay?.isOpen) {
      return createResponse(200, {
        success: true,
        availability: [],
        message: 'No hay horarios disponibles para esta fecha',
      });
    }

    // Get existing appointments for this date
    const existingAppointments = await getAppointmentsByOrgAndDate(orgId, date);
    console.log(`📅 [Availability] Found ${existingAppointments.length} total appointments for ${date}:`, existingAppointments);
    
    // Filter out cancelled appointments
    const activeAppointments = existingAppointments.filter(
      apt => apt.status !== 'cancelled' && apt.status !== 'no_show'
    );
    console.log(`✅ [Availability] ${activeAppointments.length} active appointments after filtering cancelled/no-show`);

    // Generate time slots
    const startTime = businessDay.openTime;
    const endTime = businessDay.closeTime;
    const buffer = organization.settings.appointmentSystem?.bufferBetweenAppointments || 15;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    const availableSlots = [];
    const appointmentModel = organization.settings.appointmentSystem?.appointmentModel;

    for (let minutes = startMinutes; minutes + serviceDuration <= endMinutes; minutes += serviceDuration + buffer) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      // Count existing appointments at this time slot
      const appointmentsAtTime = activeAppointments.filter(apt => {
        // Parse appointment time from datetime string or time field
        const appointmentTime = apt.datetime ? 
          new Date(apt.datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) :
          apt.time; // Fallback to time field if datetime is not available
        
        console.log(`🔍 [Availability] Comparing appointment time "${appointmentTime}" with slot time "${timeString}"`);
        const matches = appointmentTime === timeString;
        if (matches) {
          console.log(`✅ [Availability] Found matching appointment at ${timeString}:`, apt);
        }
        return matches;
      });
      
      console.log(`📊 [Availability] Time slot ${timeString}: Found ${appointmentsAtTime.length} existing appointments from ${activeAppointments.length} total active appointments`);

      if (appointmentModel === 'resource_based') {
        // For resource-based systems, calculate remaining slots
        const maxResources = organization.settings.appointmentSystem?.maxResources || 1;
        const occupiedSlots = appointmentsAtTime.length;
        const availableCount = Math.max(0, maxResources - occupiedSlots);
        
        availableSlots.push({
          time: timeString,
          available: availableCount > 0,
          availableCount: availableCount,
          professionalId: null,
        });
      } else {
        // For professional-based systems, check availability
        let isAvailable = false;
        let availableCount = 0;
        
        if (professionalId) {
          // Check if this specific professional is available
          const professionalBooked = appointmentsAtTime.some(apt => 
            apt.professionalId === professionalId || apt.staffId === professionalId
          );
          isAvailable = !professionalBooked;
          availableCount = isAvailable ? 1 : 0;
        } else {
          // Check if any professional can take this slot
          const totalProfessionals = organization.settings.appointmentSystem?.maxProfessionals || 1;
          const occupiedSlots = appointmentsAtTime.length;
          availableCount = Math.max(0, totalProfessionals - occupiedSlots);
          isAvailable = availableCount > 0;
        }
        
        availableSlots.push({
          time: timeString,
          available: isAvailable,
          availableCount: availableCount,
          professionalId: professionalId || null,
        });
      }
    }

    console.log(`✅ Generated ${availableSlots.length} available slots`);

    return createResponse(200, {
      success: true,
      availability: availableSlots,
      date: date,
      professionalId: professionalId || null,
    });

  } catch (error: any) {
    console.error('❌ Error in getPublicAvailability:', error);
    return createResponse(500, {
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// POST /public/organization/{orgId}/appointments
export const createPublicAppointment = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const orgId = event.pathParameters?.orgId;
    
    if (!orgId) {
      return createResponse(400, {
        success: false,
        message: 'ID de organización requerido',
      });
    }

    if (!event.body) {
      return createResponse(400, {
        success: false,
        message: 'Datos de la cita requeridos',
      });
    }

    const appointmentData = JSON.parse(event.body);
    
    // Validate required fields
    const requiredFields = ['serviceId', 'date', 'time', 'clientName', 'clientPhone', 'clientEmail'];
    const missingFields = requiredFields.filter(field => !appointmentData[field]);
    
    if (missingFields.length > 0) {
      return createResponse(400, {
        success: false,
        message: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
      });
    }

    console.log(`📋 Creating public appointment for organization: ${orgId}`);
    console.log('Appointment data:', JSON.stringify(appointmentData, null, 2));

    const organization = await getOrganizationById(orgId);
    
    if (!organization) {
      return createResponse(404, {
        success: false,
        message: 'Organización no encontrada',
      });
    }

    // Validate service exists
    const service = organization.settings.services?.find(s => s.id === appointmentData.serviceId);
    if (!service || service.isActive === false) {
      return createResponse(400, {
        success: false,
        message: 'Servicio no encontrado o no disponible',
      });
    }

    // Validate professional if required
    if (appointmentData.professionalId) {
      const professional = organization.settings.appointmentSystem?.professionals?.find(
        p => p.id === appointmentData.professionalId && p.isActive
      );
      if (!professional) {
        return createResponse(400, {
          success: false,
          message: 'Profesional no encontrado o no disponible',
        });
      }
    }

    // Create datetime ISO string from date and time
    const [year, month, day] = appointmentData.date.split('-').map(Number);
    const [hour, minute] = appointmentData.time.split(':').map(Number);
    const appointmentDateTime = new Date(year, month - 1, day, hour, minute);
    
    // Check if time slot is still available before creating
    const existingAppointments = await getAppointmentsByOrgAndDate(orgId, appointmentData.date);
    const activeAppointments = existingAppointments.filter(
      apt => apt.status !== 'cancelled' && apt.status !== 'no_show'
    );
    
    const appointmentsAtTime = activeAppointments.filter(apt => {
      const appointmentTime = apt.datetime ? 
        new Date(apt.datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) :
        apt.time;
      return appointmentTime === appointmentData.time;
    });

    const appointmentModel = organization.settings.appointmentSystem?.appointmentModel;
    let canBook = false;

    if (appointmentModel === 'resource_based') {
      const maxResources = organization.settings.appointmentSystem?.maxResources || 1;
      const occupiedSlots = appointmentsAtTime.length;
      canBook = occupiedSlots < maxResources;
    } else {
      if (appointmentData.professionalId) {
        // Check if specific professional is available
        const professionalBooked = appointmentsAtTime.some(apt => 
          apt.professionalId === appointmentData.professionalId || apt.staffId === appointmentData.professionalId
        );
        canBook = !professionalBooked;
      } else {
        // Check if any professional can take this slot
        const totalProfessionals = organization.settings.appointmentSystem?.maxProfessionals || 1;
        const occupiedSlots = appointmentsAtTime.length;
        canBook = occupiedSlots < totalProfessionals;
      }
    }

    if (!canBook) {
      return createResponse(409, {
        success: false,
        message: 'El horario seleccionado ya no está disponible. Por favor selecciona otro horario.',
      });
    }

    // Create the appointment in the database
    const newAppointment = await createAppointment({
      orgId: orgId,
      serviceId: appointmentData.serviceId,
      staffId: appointmentData.professionalId || undefined, // Staff ID for professional
      professionalId: appointmentData.professionalId || undefined, // Keep professional ID separate
      resourceId: appointmentModel === 'resource_based' ? 'default-resource' : undefined,
      datetime: appointmentDateTime.toISOString(),
      duration: service.duration,
      status: appointmentData.status || 'pending',
      clientName: appointmentData.clientName,
      clientPhone: appointmentData.clientPhone,
      clientEmail: appointmentData.clientEmail,
      notes: appointmentData.notes || '',
      serviceName: service.name,
      servicePrice: service.price,
      time: appointmentData.time, // Store time separately for easier queries
    });

    console.log('✅ Public appointment created successfully:', newAppointment.id);

    return createResponse(201, {
      success: true,
      appointment: newAppointment,
      message: 'Cita creada exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error in createPublicAppointment:', error);
    return createResponse(500, {
      success: false,
      message: 'Error interno del servidor',
    });
  }
};