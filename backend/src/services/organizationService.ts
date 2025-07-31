import { z } from 'zod';
import { 
  createOrganization, 
  getOrganizationById, 
  updateOrganization,
  getDefaultOrganizationSettings,
  Organization 
} from '../repositories/organizationRepository';
import { getUserById } from '../repositories/userRepository';

const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
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
  }).optional(),
});

export interface CreateOrganizationData {
  name: string;
  templateType: 'beauty_salon' | 'hyperbaric_center';
  ownerId: string;
}

export interface UpdateOrganizationData {
  name?: string;
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
  const validatedUpdates = updateOrganizationSchema.parse(updates);

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
    const organizationToUpdate: Organization = {
      ...currentOrg,
      ...(validatedUpdates.name && { name: validatedUpdates.name }),
      ...(validatedUpdates.settings && {
        settings: {
          ...currentOrg.settings,
          ...(validatedUpdates.settings.timezone && { 
            timezone: validatedUpdates.settings.timezone 
          }),
          ...(validatedUpdates.settings.businessHours && { 
            businessHours: {
              ...currentOrg.settings.businessHours,
              ...validatedUpdates.settings.businessHours,
            }
          }),
          ...(validatedUpdates.settings.notifications && { 
            notifications: {
              ...currentOrg.settings.notifications,
              ...validatedUpdates.settings.notifications,
            }
          }),
        }
      }),
      updatedAt: new Date().toISOString(),
    };

    // Update organization in database
    const updatedOrganization = await updateOrganization(orgId, organizationToUpdate);
    
    return {
      success: true,
      organization: {
        id: updatedOrganization.id,
        name: updatedOrganization.name,
        templateType: updatedOrganization.templateType,
        settings: updatedOrganization.settings,
        subscription: updatedOrganization.subscription,
        updatedAt: updatedOrganization.updatedAt,
      },
      message: 'Organizaci�n actualizada exitosamente',
    };
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