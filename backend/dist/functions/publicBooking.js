"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublicAppointment = exports.getPublicAvailability = exports.getPublicDailyAvailabilityCounts = exports.getPublicProfessionals = exports.getPublicServices = exports.getPublicOrganization = void 0;
const response_1 = require("../utils/response");
const organizationRepository_1 = require("../repositories/organizationRepository");
// GET /public/organization/{orgId}
const getPublicOrganization = async (event) => {
    try {
        const orgId = event.pathParameters?.orgId;
        if (!orgId) {
            return (0, response_1.createResponse)(400, {
                success: false,
                message: 'ID de organización requerido',
            });
        }
        console.log(`📋 Getting public organization data for: ${orgId}`);
        const organization = await (0, organizationRepository_1.getOrganizationById)(orgId);
        if (!organization) {
            return (0, response_1.createResponse)(404, {
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
        return (0, response_1.createResponse)(200, {
            success: true,
            organization: publicOrganizationData,
        });
    }
    catch (error) {
        console.error('❌ Error in getPublicOrganization:', error);
        return (0, response_1.createResponse)(500, {
            success: false,
            message: 'Error interno del servidor',
        });
    }
};
exports.getPublicOrganization = getPublicOrganization;
// GET /public/organization/{orgId}/services
const getPublicServices = async (event) => {
    try {
        const orgId = event.pathParameters?.orgId;
        if (!orgId) {
            return (0, response_1.createResponse)(400, {
                success: false,
                message: 'ID de organización requerido',
            });
        }
        console.log(`📋 Getting public services for organization: ${orgId}`);
        const organization = await (0, organizationRepository_1.getOrganizationById)(orgId);
        if (!organization) {
            return (0, response_1.createResponse)(404, {
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
        return (0, response_1.createResponse)(200, {
            success: true,
            services: activeServices,
        });
    }
    catch (error) {
        console.error('❌ Error in getPublicServices:', error);
        return (0, response_1.createResponse)(500, {
            success: false,
            message: 'Error interno del servidor',
        });
    }
};
exports.getPublicServices = getPublicServices;
// GET /public/organization/{orgId}/professionals
const getPublicProfessionals = async (event) => {
    try {
        const orgId = event.pathParameters?.orgId;
        if (!orgId) {
            return (0, response_1.createResponse)(400, {
                success: false,
                message: 'ID de organización requerido',
            });
        }
        console.log(`📋 Getting public professionals for organization: ${orgId}`);
        const organization = await (0, organizationRepository_1.getOrganizationById)(orgId);
        if (!organization) {
            return (0, response_1.createResponse)(404, {
                success: false,
                message: 'Organización no encontrada',
            });
        }
        // Check if organization uses professional-based system
        const appointmentModel = organization.settings.appointmentSystem?.appointmentModel;
        if (appointmentModel !== 'professional_based') {
            return (0, response_1.createResponse)(200, {
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
        return (0, response_1.createResponse)(200, {
            success: true,
            professionals: activeProfessionals,
        });
    }
    catch (error) {
        console.error('❌ Error in getPublicProfessionals:', error);
        return (0, response_1.createResponse)(500, {
            success: false,
            message: 'Error interno del servidor',
        });
    }
};
exports.getPublicProfessionals = getPublicProfessionals;
// GET /public/organization/{orgId}/availability/daily-counts
const getPublicDailyAvailabilityCounts = async (event) => {
    try {
        const orgId = event.pathParameters?.orgId;
        const professionalId = event.queryStringParameters?.professionalId;
        const datesParam = event.queryStringParameters?.dates;
        const serviceDuration = parseInt(event.queryStringParameters?.serviceDuration || '60');
        if (!orgId) {
            return (0, response_1.createResponse)(400, {
                success: false,
                message: 'ID de organización requerido',
            });
        }
        if (!datesParam) {
            return (0, response_1.createResponse)(400, {
                success: false,
                message: 'Fechas requeridas',
            });
        }
        const dates = datesParam.split(',');
        console.log(`📋 Getting daily availability counts for org: ${orgId}, professional: ${professionalId}, dates: ${dates.join(', ')}`);
        const organization = await (0, organizationRepository_1.getOrganizationById)(orgId);
        if (!organization) {
            return (0, response_1.createResponse)(404, {
                success: false,
                message: 'Organización no encontrada',
            });
        }
        const dailyCounts = [];
        for (const date of dates) {
            const requestDate = new Date(date);
            const dayName = requestDate.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
            const businessDay = organization.settings.businessHours[dayName];
            if (!businessDay?.isOpen) {
                dailyCounts.push({
                    date,
                    availableSlots: 0
                });
                continue;
            }
            // Generate time slots for this date
            const startTime = businessDay.openTime;
            const endTime = businessDay.closeTime;
            const buffer = organization.settings.appointmentSystem?.bufferBetweenAppointments || 15;
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            let availableSlotCount = 0;
            for (let minutes = startMinutes; minutes + serviceDuration <= endMinutes; minutes += serviceDuration + buffer) {
                // TODO: In a real implementation, check against existing appointments
                // For resource-based systems, also consider available resource count
                const appointmentModel = organization.settings.appointmentSystem?.appointmentModel;
                if (appointmentModel === 'resource_based') {
                    // For resource-based, each time slot can have multiple appointments
                    const resourceCount = organization.settings.appointmentSystem?.maxResources || 1;
                    availableSlotCount += resourceCount;
                }
                else {
                    // For professional-based, each time slot is one appointment
                    availableSlotCount += 1;
                }
            }
            dailyCounts.push({
                date,
                availableSlots: availableSlotCount
            });
        }
        console.log(`✅ Generated daily counts for ${dates.length} dates`);
        return (0, response_1.createResponse)(200, {
            success: true,
            dailyCounts,
        });
    }
    catch (error) {
        console.error('❌ Error in getPublicDailyAvailabilityCounts:', error);
        return (0, response_1.createResponse)(500, {
            success: false,
            message: 'Error interno del servidor',
        });
    }
};
exports.getPublicDailyAvailabilityCounts = getPublicDailyAvailabilityCounts;
// GET /public/organization/{orgId}/availability
const getPublicAvailability = async (event) => {
    try {
        const orgId = event.pathParameters?.orgId;
        const professionalId = event.queryStringParameters?.professionalId;
        const date = event.queryStringParameters?.date;
        const serviceDuration = parseInt(event.queryStringParameters?.serviceDuration || '60');
        if (!orgId) {
            return (0, response_1.createResponse)(400, {
                success: false,
                message: 'ID de organización requerido',
            });
        }
        if (!date) {
            return (0, response_1.createResponse)(400, {
                success: false,
                message: 'Fecha requerida',
            });
        }
        console.log(`📋 Getting availability for org: ${orgId}, professional: ${professionalId}, date: ${date}`);
        const organization = await (0, organizationRepository_1.getOrganizationById)(orgId);
        if (!organization) {
            return (0, response_1.createResponse)(404, {
                success: false,
                message: 'Organización no encontrada',
            });
        }
        // Get business hours for the requested date
        const requestDate = new Date(date);
        const dayName = requestDate.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        const businessDay = organization.settings.businessHours[dayName];
        if (!businessDay?.isOpen) {
            return (0, response_1.createResponse)(200, {
                success: true,
                availability: [],
                message: 'No hay horarios disponibles para esta fecha',
            });
        }
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
            // TODO: In a real implementation, check against existing appointments
            // For now, we'll return all possible slots as available
            if (appointmentModel === 'resource_based') {
                // For resource-based systems, show available count
                const resourceCount = organization.settings.appointmentSystem?.maxResources || 1;
                availableSlots.push({
                    time: timeString,
                    available: true,
                    availableCount: resourceCount,
                    professionalId: null,
                });
            }
            else {
                // For professional-based systems, show single availability
                availableSlots.push({
                    time: timeString,
                    available: true,
                    availableCount: 1,
                    professionalId: professionalId || null,
                });
            }
        }
        console.log(`✅ Generated ${availableSlots.length} available slots`);
        return (0, response_1.createResponse)(200, {
            success: true,
            availability: availableSlots,
            date: date,
            professionalId: professionalId || null,
        });
    }
    catch (error) {
        console.error('❌ Error in getPublicAvailability:', error);
        return (0, response_1.createResponse)(500, {
            success: false,
            message: 'Error interno del servidor',
        });
    }
};
exports.getPublicAvailability = getPublicAvailability;
// POST /public/organization/{orgId}/appointments
const createPublicAppointment = async (event) => {
    try {
        const orgId = event.pathParameters?.orgId;
        if (!orgId) {
            return (0, response_1.createResponse)(400, {
                success: false,
                message: 'ID de organización requerido',
            });
        }
        if (!event.body) {
            return (0, response_1.createResponse)(400, {
                success: false,
                message: 'Datos de la cita requeridos',
            });
        }
        const appointmentData = JSON.parse(event.body);
        // Validate required fields
        const requiredFields = ['serviceId', 'date', 'time', 'clientName', 'clientPhone', 'clientEmail'];
        const missingFields = requiredFields.filter(field => !appointmentData[field]);
        if (missingFields.length > 0) {
            return (0, response_1.createResponse)(400, {
                success: false,
                message: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
            });
        }
        console.log(`📋 Creating public appointment for organization: ${orgId}`);
        console.log('Appointment data:', JSON.stringify(appointmentData, null, 2));
        const organization = await (0, organizationRepository_1.getOrganizationById)(orgId);
        if (!organization) {
            return (0, response_1.createResponse)(404, {
                success: false,
                message: 'Organización no encontrada',
            });
        }
        // Validate service exists
        const service = organization.settings.services?.find(s => s.id === appointmentData.serviceId);
        if (!service || service.isActive === false) {
            return (0, response_1.createResponse)(400, {
                success: false,
                message: 'Servicio no encontrado o no disponible',
            });
        }
        // Validate professional if required
        if (appointmentData.professionalId) {
            const professional = organization.settings.appointmentSystem?.professionals?.find(p => p.id === appointmentData.professionalId && p.isActive);
            if (!professional) {
                return (0, response_1.createResponse)(400, {
                    success: false,
                    message: 'Profesional no encontrado o no disponible',
                });
            }
        }
        // TODO: In a real implementation, save to appointments table
        // For now, we'll simulate the appointment creation
        const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newAppointment = {
            id: appointmentId,
            organizationId: orgId,
            serviceId: appointmentData.serviceId,
            serviceName: service.name,
            servicePrice: service.price,
            serviceDuration: service.duration,
            professionalId: appointmentData.professionalId || null,
            date: appointmentData.date,
            time: appointmentData.time,
            clientName: appointmentData.clientName,
            clientPhone: appointmentData.clientPhone,
            clientEmail: appointmentData.clientEmail,
            notes: appointmentData.notes || '',
            status: 'confirmed',
            createdAt: new Date().toISOString(),
        };
        console.log('✅ Public appointment created successfully:', appointmentId);
        return (0, response_1.createResponse)(201, {
            success: true,
            appointment: newAppointment,
            message: 'Cita creada exitosamente',
        });
    }
    catch (error) {
        console.error('❌ Error in createPublicAppointment:', error);
        return (0, response_1.createResponse)(500, {
            success: false,
            message: 'Error interno del servidor',
        });
    }
};
exports.createPublicAppointment = createPublicAppointment;
