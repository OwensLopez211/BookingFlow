"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationTemplatesService = exports.updateOrganizationService = exports.getOrganizationService = exports.createOrganizationService = void 0;
const zod_1 = require("zod");
const organizationRepository_1 = require("../repositories/organizationRepository");
const userRepository_1 = require("../repositories/userRepository");
const updateOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    settings: zod_1.z.object({
        timezone: zod_1.z.string().optional(),
        businessHours: zod_1.z.record(zod_1.z.string(), zod_1.z.object({
            isOpen: zod_1.z.boolean(),
            openTime: zod_1.z.string(),
            closeTime: zod_1.z.string(),
        })).optional(),
        notifications: zod_1.z.object({
            emailReminders: zod_1.z.boolean().optional(),
            smsReminders: zod_1.z.boolean().optional(),
            autoConfirmation: zod_1.z.boolean().optional(),
            reminderHours: zod_1.z.number().optional(),
        }).optional(),
    }).optional(),
});
const createOrganizationService = async (data) => {
    try {
        // Validate that the owner exists
        const owner = await (0, userRepository_1.getUserById)(data.ownerId);
        if (!owner) {
            throw new Error('Usuario propietario no encontrado');
        }
        if (owner.role !== 'owner') {
            throw new Error('Solo los propietarios pueden crear organizaciones');
        }
        // Get default settings for the template type
        const defaults = (0, organizationRepository_1.getDefaultOrganizationSettings)(data.templateType);
        // Create organization
        const organization = await (0, organizationRepository_1.createOrganization)({
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
    }
    catch (error) {
        console.error('Error in createOrganizationService:', error);
        throw new Error(error.message || 'Error creando la organizaci�n');
    }
};
exports.createOrganizationService = createOrganizationService;
const getOrganizationService = async (orgId, userId) => {
    try {
        // Validate that the user exists and belongs to the organization
        const user = await (0, userRepository_1.getUserById)(userId);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        if (user.orgId !== orgId) {
            throw new Error('No tienes permisos para acceder a esta organizaci�n');
        }
        // Get organization
        const organization = await (0, organizationRepository_1.getOrganizationById)(orgId);
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
    }
    catch (error) {
        console.error('Error in getOrganizationService:', error);
        throw new Error(error.message || 'Error obteniendo la organizaci�n');
    }
};
exports.getOrganizationService = getOrganizationService;
const updateOrganizationService = async (orgId, userId, updates) => {
    const validatedUpdates = updateOrganizationSchema.parse(updates);
    try {
        // Validate that the user exists and has permissions
        const user = await (0, userRepository_1.getUserById)(userId);
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
        const currentOrg = await (0, organizationRepository_1.getOrganizationById)(orgId);
        if (!currentOrg) {
            throw new Error('Organizaci�n no encontrada');
        }
        // Merge updates with current organization
        const organizationToUpdate = {
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
        const updatedOrganization = await (0, organizationRepository_1.updateOrganization)(orgId, organizationToUpdate);
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
    }
    catch (error) {
        console.error('Error in updateOrganizationService:', error);
        throw new Error(error.message || 'Error actualizando la organizaci�n');
    }
};
exports.updateOrganizationService = updateOrganizationService;
const getOrganizationTemplatesService = async () => {
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
                defaultSettings: (0, organizationRepository_1.getDefaultOrganizationSettings)('beauty_salon'),
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
                defaultSettings: (0, organizationRepository_1.getDefaultOrganizationSettings)('hyperbaric_center'),
            },
        ];
        return {
            success: true,
            templates,
            message: 'Templates obtenidos exitosamente',
        };
    }
    catch (error) {
        console.error('Error in getOrganizationTemplatesService:', error);
        throw new Error(error.message || 'Error obteniendo los templates');
    }
};
exports.getOrganizationTemplatesService = getOrganizationTemplatesService;
