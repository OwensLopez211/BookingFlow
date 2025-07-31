import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import * as businessConfigRepo from '../repositories/businessConfigurationRepository';
import * as availabilityService from '../services/availabilityService';

export const createBusinessConfiguration = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const configData = JSON.parse(event.body || '{}');
    const config = await businessConfigRepo.createBusinessConfiguration({
      orgId: user.orgId,
      ...configData,
    });

    return createResponse(201, { 
      message: 'Business configuration created successfully',
      data: config 
    });
  } catch (error: any) {
    console.error('Create business configuration error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const getBusinessConfiguration = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const config = await businessConfigRepo.getBusinessConfigurationByOrgId(user.orgId);
    if (!config) {
      // Return default configuration if none exists
      const defaultConfig = businessConfigRepo.getDefaultBusinessConfiguration(user.orgId, 'custom');
      return createResponse(200, { data: defaultConfig });
    }

    return createResponse(200, { data: config });
  } catch (error: any) {
    console.error('Get business configuration error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const updateBusinessConfiguration = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const configId = event.pathParameters?.id;
    if (!configId) {
      return createResponse(400, { error: 'Configuration ID is required' });
    }

    const updates = JSON.parse(event.body || '{}');
    const config = await businessConfigRepo.updateBusinessConfiguration(user.orgId, configId, updates);

    return createResponse(200, { 
      message: 'Business configuration updated successfully',
      data: config 
    });
  } catch (error: any) {
    console.error('Update business configuration error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const initializeBusinessConfiguration = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const { industryType } = JSON.parse(event.body || '{}');
    if (!industryType) {
      return createResponse(400, { error: 'Industry type is required' });
    }

    // Check if configuration already exists
    const existingConfig = await businessConfigRepo.getBusinessConfigurationByOrgId(user.orgId);
    if (existingConfig) {
      return createResponse(400, { error: 'Business configuration already exists' });
    }

    // Create default configuration for the industry
    const defaultConfigData = businessConfigRepo.getDefaultBusinessConfiguration(user.orgId, industryType);
    const config = await businessConfigRepo.createBusinessConfiguration(defaultConfigData);

    return createResponse(201, { 
      message: 'Business configuration initialized successfully',
      data: config 
    });
  } catch (error: any) {
    console.error('Initialize business configuration error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const getIndustryTemplates = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const templates = [
      {
        industryType: 'beauty_salon',
        name: 'Salón de Belleza',
        description: 'Perfecto para peluquerías, salones de belleza y spas',
        appointmentModel: 'professional_based',
        features: ['Selección de profesional', 'Gestión de comisiones', 'Servicios múltiples'],
        defaultSettings: {
          allowClientSelection: true,
          bufferBetweenAppointments: 10,
          maxAdvanceBookingDays: 30,
        }
      },
      {
        industryType: 'medical_clinic',
        name: 'Clínica Médica',
        description: 'Ideal para consultorios médicos y clínicas',
        appointmentModel: 'professional_based',
        features: ['Gestión de doctores', 'Políticas de cancelación estrictas', 'Recordatorios automáticos'],
        defaultSettings: {
          allowClientSelection: false,
          bufferBetweenAppointments: 20,
          maxAdvanceBookingDays: 60,
          cancellationPolicy: {
            hoursBeforeAppointment: 48,
            penaltyPercentage: 25,
          }
        }
      },
      {
        industryType: 'hyperbaric_center',
        name: 'Centro Hiperbárico',
        description: 'Especializado en terapias de cámara hiperbárica',
        appointmentModel: 'resource_based',
        features: ['Gestión de cámaras', 'Asignación automática', 'Protocolos de seguridad'],
        defaultSettings: {
          requireResourceAssignment: true,
          bufferBetweenAppointments: 30,
          maxAdvanceBookingDays: 14,
        }
      },
      {
        industryType: 'fitness_center',
        name: 'Centro de Fitness',
        description: 'Para gimnasios y centros de entrenamiento',
        appointmentModel: 'hybrid',
        features: ['Entrenadores personales', 'Equipos especializados', 'Clases grupales'],
        defaultSettings: {
          allowClientSelection: true,
          requireResourceAssignment: true,
          bufferBetweenAppointments: 5,
        }
      },
      {
        industryType: 'consultant',
        name: 'Consultoría',
        description: 'Para consultores y profesionales independientes',
        appointmentModel: 'professional_based',
        features: ['Reuniones virtuales', 'Tarifas por hora', 'Agenda flexible'],
        defaultSettings: {
          allowClientSelection: false,
          bufferBetweenAppointments: 0,
          maxAdvanceBookingDays: 60,
        }
      },
      {
        industryType: 'custom',
        name: 'Personalizado',
        description: 'Configuración flexible para cualquier tipo de negocio',
        appointmentModel: 'hybrid',
        features: ['Totalmente personalizable', 'Campos personalizados', 'Flujos adaptativos'],
        defaultSettings: {
          allowClientSelection: true,
          requireResourceAssignment: false,
          bufferBetweenAppointments: 15,
        }
      }
    ];

    return createResponse(200, { data: templates });
  } catch (error: any) {
    console.error('Get industry templates error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const generateOrganizationAvailability = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const { startDate, endDate, slotDuration = 30, override = false } = JSON.parse(event.body || '{}');

    if (!startDate || !endDate) {
      return createResponse(400, { error: 'Start date and end date are required' });
    }

    await availabilityService.generateAvailabilityForOrganization(user.orgId, {
      startDate,
      endDate,
      slotDuration,
      override,
    });

    return createResponse(200, { message: 'Organization availability generated successfully' });
  } catch (error: any) {
    console.error('Generate organization availability error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const getAvailableSlots = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const queryParams = event.queryStringParameters || {};
    const { date, duration, entityType, entityId, specialty } = queryParams;

    if (!date || !duration) {
      return createResponse(400, { error: 'Date and duration are required' });
    }

    const requiredSpecialties = specialty ? specialty.split(',') : [];
    
    const availableSlots = await availabilityService.findAvailableSlots(
      user.orgId,
      date,
      parseInt(duration),
      entityType as any,
      entityId,
      requiredSpecialties
    );

    return createResponse(200, { data: availableSlots });
  } catch (error: any) {
    console.error('Get available slots error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};