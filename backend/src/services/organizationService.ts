import { z } from 'zod';
import { 
  createOrganization, 
  getOrganizationById, 
  updateOrganization,
  getDefaultOrganizationSettings,
  Organization 
} from '../repositories/organizationRepository';
import { getUserById } from '../repositories/userRepository';
import { 
  getBusinessConfigurationByOrgId, 
  updateBusinessConfiguration 
} from '../repositories/businessConfigurationRepository';

const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('Email inválido').nullable().optional().or(z.literal('')),
  currency: z.string().optional(),
  settings: z.object({
    timezone: z.string().optional(),
    businessHours: z.record(z.string(), z.object({
      isOpen: z.boolean(),
      openTime: z.string(),
      closeTime: z.string(),
    })).optional(),
    notifications: z.object({
      emailReminders: z.boolean().optional(),
      smsReminders: z.boolean().optional(),
      autoConfirmation: z.boolean().optional(),
      reminderHours: z.number().optional(),
    }).optional(),
    appointmentSystem: z.object({
      appointmentModel: z.enum(['professional_based', 'resource_based', 'hybrid']).optional(),
      allowClientSelection: z.boolean().optional(),
      bufferBetweenAppointments: z.number().optional(),
      maxAdvanceBookingDays: z.number().optional(),
      maxProfessionals: z.number().min(1).max(50).optional(),
      maxResources: z.number().min(1).max(50).optional(),
      professionals: z.array(z.object({
        id: z.string(),
        name: z.string(),
        photo: z.string().optional(),
        isActive: z.boolean(),
      })).optional(),
    }).optional(),
    businessConfiguration: z.object({
      appointmentModel: z.enum(['professional_based', 'resource_based', 'hybrid']).optional(),
      allowClientSelection: z.boolean().optional(),
      bufferBetweenAppointments: z.number().optional(),
      maxAdvanceBookingDays: z.number().optional(),
      maxProfessionals: z.number().min(1).max(50).optional(),
      maxResources: z.number().min(1).max(50).optional(),
      professionals: z.array(z.object({
        id: z.string(),
        name: z.string(),
        photo: z.string().optional(),
        isActive: z.boolean(),
      })).optional(),
    }).optional(),
    businessInfo: z.object({
      businessName: z.string().optional(),
      businessAddress: z.string().nullable().optional(),
      businessPhone: z.string().nullable().optional(),
      businessEmail: z.string().email('Email inválido').nullable().optional().or(z.literal('')),
    }).optional(),
    services: z.array(z.object({
      id: z.string().optional(),
      name: z.string(),
      description: z.string().optional(),
      duration: z.number().positive('La duración debe ser positiva'),
      price: z.number().min(0, 'El precio no puede ser negativo'),
      isActive: z.boolean().optional(),
    })).optional(),
    currency: z.string().optional(),
  }).optional(),
});

export interface CreateOrganizationData {
  name: string;
  templateType: 'beauty_salon' | 'hyperbaric_center';
  ownerId: string;
}

export interface UpdateOrganizationData {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  settings?: {
    timezone?: string;
    businessHours?: Record<string, {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    }>;
    notifications?: {
      emailReminders?: boolean;
      smsReminders?: boolean;
      autoConfirmation?: boolean;
      reminderHours?: number;
    };
    appointmentSystem?: {
      appointmentModel?: 'professional_based' | 'resource_based' | 'hybrid';
      allowClientSelection?: boolean;
      bufferBetweenAppointments?: number;
      maxAdvanceBookingDays?: number;
      maxProfessionals?: number;
      maxResources?: number;
      professionals?: Array<{
        id: string;
        name: string;
        photo?: string;
        isActive: boolean;
      }>;
    };
    businessConfiguration?: {
      appointmentModel?: 'professional_based' | 'resource_based' | 'hybrid';
      allowClientSelection?: boolean;
      bufferBetweenAppointments?: number;
      maxAdvanceBookingDays?: number;
      maxProfessionals?: number;
      maxResources?: number;
      professionals?: Array<{
        id: string;
        name: string;
        photo?: string;
        isActive: boolean;
      }>;
    };
    businessInfo?: {
      businessName?: string;
      businessAddress?: string;
      businessPhone?: string;
      businessEmail?: string;
    };
    services?: Array<{
      id?: string;
      name: string;
      description?: string;
      duration: number;
      price: number;
      isActive?: boolean;
    }>;
    currency?: string;
  };
}

export const createOrganizationService = async (data: CreateOrganizationData) => {
  try {
    // Validate that the owner exists
    const owner = await getUserById(data.ownerId);
    if (!owner) {
      throw new Error('Usuario propietario no encontrado');
    }

    if (owner.role !== 'owner') {
      throw new Error('Solo los propietarios pueden crear organizaciones');
    }

    // Get default settings for the template type
    const defaults = getDefaultOrganizationSettings(data.templateType);

    // Create organization
    const organization = await createOrganization({
      name: data.name,
      templateType: data.templateType,
      ...defaults,
    });

    return {
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        templateType: organization.templateType,
        settings: organization.settings,
        subscription: organization.subscription,
        createdAt: organization.createdAt,
      },
      message: 'Organizaci�n creada exitosamente',
    };
  } catch (error: any) {
    console.error('Error in createOrganizationService:', error);
    throw new Error(error.message || 'Error creando la organizaci�n');
  }
};

export const getOrganizationService = async (orgId: string, userId: string) => {
  try {
    // Validate that the user exists and belongs to the organization
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.orgId !== orgId) {
      throw new Error('No tienes permisos para acceder a esta organizaci�n');
    }

    // Get organization
    const organization = await getOrganizationById(orgId);
    if (!organization) {
      throw new Error('Organizaci�n no encontrada');
    }

    return {
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        templateType: organization.templateType,
        address: organization.address,
        phone: organization.phone,
        email: organization.email,
        currency: organization.currency,
        settings: organization.settings,
        subscription: organization.subscription,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      },
    };
  } catch (error: any) {
    console.error('Error in getOrganizationService:', error);
    throw new Error(error.message || 'Error obteniendo la organizaci�n');
  }
};

export const updateOrganizationService = async (
  orgId: string, 
  userId: string, 
  updates: UpdateOrganizationData
) => {
  console.log('🔄 updateOrganizationService called with:');
  console.log('  - orgId:', orgId);
  console.log('  - userId:', userId);
  console.log('  - updates:', JSON.stringify(updates, null, 2));

  const validatedUpdates = updateOrganizationSchema.parse(updates);
  console.log('✅ Validation passed, validated updates:', JSON.stringify(validatedUpdates, null, 2));

  try {
    // Validate that the user exists and has permissions
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.orgId !== orgId) {
      throw new Error('No tienes permisos para modificar esta organizaci�n');
    }

    if (user.role !== 'owner' && user.role !== 'admin') {
      throw new Error('Solo los propietarios y administradores pueden modificar la organizaci�n');
    }

    // Get current organization
    const currentOrg = await getOrganizationById(orgId);
    if (!currentOrg) {
      throw new Error('Organizaci�n no encontrada');
    }

    // Merge updates with current organization
    console.log('📋 Current organization before update:', JSON.stringify(currentOrg, null, 2));
    
    // Handle synchronization between organization root fields and businessInfo
    const syncBusinessInfo = {
      ...currentOrg.settings.businessInfo,
      // Sync organization root fields to businessInfo if they're being updated
      ...(validatedUpdates.name !== undefined && { businessName: validatedUpdates.name }),
      ...(validatedUpdates.address !== undefined && { businessAddress: validatedUpdates.address }),
      ...(validatedUpdates.phone !== undefined && { businessPhone: validatedUpdates.phone }),
      ...(validatedUpdates.email !== undefined && { businessEmail: validatedUpdates.email }),
      // Apply any direct businessInfo updates
      ...(validatedUpdates.settings?.businessInfo ? validatedUpdates.settings.businessInfo : {}),
    };
    
    // Check if we need to update settings (either because settings were provided or root fields changed)
    const needsSettingsUpdate = validatedUpdates.settings || 
                                validatedUpdates.name !== undefined || 
                                validatedUpdates.address !== undefined || 
                                validatedUpdates.phone !== undefined || 
                                validatedUpdates.email !== undefined;
    
    console.log('🔍 Settings update analysis:');
    console.log('  - validatedUpdates.settings exists:', !!validatedUpdates.settings);
    console.log('  - needsSettingsUpdate:', needsSettingsUpdate);
    console.log('  - syncBusinessInfo:', JSON.stringify(syncBusinessInfo, null, 2));

    const organizationToUpdate: Organization = {
      ...currentOrg,
      ...(validatedUpdates.name !== undefined && { name: validatedUpdates.name }),
      ...(validatedUpdates.address !== undefined && { address: validatedUpdates.address }),
      ...(validatedUpdates.phone !== undefined && { phone: validatedUpdates.phone }),
      ...(validatedUpdates.email !== undefined && { email: validatedUpdates.email }),
      ...(validatedUpdates.currency !== undefined && { currency: validatedUpdates.currency }),
      ...(needsSettingsUpdate && {
        settings: {
          ...currentOrg.settings,
          ...(validatedUpdates.settings?.timezone !== undefined && { 
            timezone: validatedUpdates.settings.timezone 
          }),
          ...(validatedUpdates.settings?.currency !== undefined && { 
            currency: validatedUpdates.settings.currency 
          }),
          ...(validatedUpdates.settings?.businessHours !== undefined && { 
            businessHours: {
              ...currentOrg.settings.businessHours,
              ...validatedUpdates.settings.businessHours,
            }
          }),
          ...(validatedUpdates.settings?.notifications !== undefined && { 
            notifications: {
              ...currentOrg.settings.notifications,
              ...validatedUpdates.settings.notifications,
            }
          }),
          ...(validatedUpdates.settings?.appointmentSystem !== undefined && { 
            appointmentSystem: {
              ...currentOrg.settings.appointmentSystem,
              ...validatedUpdates.settings.appointmentSystem,
            }
          }),
          ...(validatedUpdates.settings?.businessConfiguration !== undefined && { 
            businessConfiguration: {
              ...currentOrg.settings.businessConfiguration,
              ...validatedUpdates.settings.businessConfiguration,
            }
          }),
          // Always sync businessInfo (including automatic sync from root fields)
          businessInfo: syncBusinessInfo,
          ...(validatedUpdates.settings?.services !== undefined && { 
            services: validatedUpdates.settings.services.map(service => ({
              ...service,
              id: service.id || `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              isActive: service.isActive !== undefined ? service.isActive : true
            }))
          }),
        }
      }),
      updatedAt: new Date().toISOString(),
    };

    console.log('💾 Organization to update in database:', JSON.stringify(organizationToUpdate, null, 2));

    // Update organization in database
    const updatedOrganization = await updateOrganization(orgId, organizationToUpdate);
    
    // If appointment system or business configuration settings were updated, 
    // also update the business configuration entity
    if (validatedUpdates.settings?.appointmentSystem || validatedUpdates.settings?.businessConfiguration) {
      try {
        const businessConfig = await getBusinessConfigurationByOrgId(orgId);
        if (businessConfig) {
          const businessConfigUpdates: any = {};
          
          // Use data from appointmentSystem or businessConfiguration
          const configData = validatedUpdates.settings.appointmentSystem || validatedUpdates.settings.businessConfiguration;
          
          if (configData?.appointmentModel) {
            businessConfigUpdates.appointmentModel = configData.appointmentModel;
          }
          
          if (configData && Object.keys(configData).length > 0) {
            businessConfigUpdates.settings = {
              ...businessConfig.settings,
              ...(configData.allowClientSelection !== undefined && { 
                allowClientSelection: configData.allowClientSelection 
              }),
              ...(configData.bufferBetweenAppointments !== undefined && { 
                bufferBetweenAppointments: configData.bufferBetweenAppointments 
              }),
              ...(configData.maxAdvanceBookingDays !== undefined && { 
                maxAdvanceBookingDays: configData.maxAdvanceBookingDays 
              }),
            };
          }
          
          if (Object.keys(businessConfigUpdates).length > 0) {
            await updateBusinessConfiguration(orgId, businessConfig.id, businessConfigUpdates);
            console.log(`✅ Business configuration updated for organization: ${orgId}`);
          }
        }
      } catch (error) {
        console.error('❌ Failed to update business configuration:', error);
        // Don't fail the entire operation if business config update fails
      }
    }
    
    const finalResult = {
      success: true,
      organization: {
        id: updatedOrganization.id,
        name: updatedOrganization.name,
        templateType: updatedOrganization.templateType,
        address: updatedOrganization.address,
        phone: updatedOrganization.phone,
        email: updatedOrganization.email,
        currency: updatedOrganization.currency,
        settings: updatedOrganization.settings,
        subscription: updatedOrganization.subscription,
        createdAt: updatedOrganization.createdAt,
        updatedAt: updatedOrganization.updatedAt,
      },
      message: 'Organizaci�n actualizada exitosamente',
    };
    
    console.log('✅ Final service result:', JSON.stringify(finalResult, null, 2));
    return finalResult;
  } catch (error: any) {
    console.error('Error in updateOrganizationService:', error);
    throw new Error(error.message || 'Error actualizando la organizaci�n');
  }
};

export const getOrganizationTemplatesService = async () => {
  try {
    const templates = [
      {
        id: 'beauty_salon',
        name: 'Sal�n de Belleza',
        description: 'Perfecto para salones de belleza, peluquer�as y spas',
        features: [
          'Gesti�n de m�ltiples estilistas',
          'Servicios personalizables',
          'Sistema de reservas online',
          'Control de inventario b�sico',
        ],
        defaultSettings: getDefaultOrganizationSettings('beauty_salon'),
      },
      {
        id: 'hyperbaric_center',
        name: 'Centro Hiperb�rico',
        description: 'Especializado para centros de medicina hiperb�rica',
        features: [
          'Gesti�n de c�maras hiperb�ricas',
          'Protocolos m�dicos espec�ficos',
          'Seguimiento de tratamientos',
          'Reportes m�dicos',
        ],
        defaultSettings: getDefaultOrganizationSettings('hyperbaric_center'),
      },
    ];

    return {
      success: true,
      templates,
      message: 'Templates obtenidos exitosamente',
    };
  } catch (error: any) {
    console.error('Error in getOrganizationTemplatesService:', error);
    throw new Error(error.message || 'Error obteniendo los templates');
  }
};