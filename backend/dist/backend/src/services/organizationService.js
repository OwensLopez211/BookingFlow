"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationTemplatesService = exports.updateOrganizationService = exports.getOrganizationService = exports.createOrganizationService = void 0;
const zod_1 = require("zod");
const organizationRepository_1 = require("../repositories/organizationRepository");
const userRepository_1 = require("../repositories/userRepository");
const businessConfigurationRepository_1 = require("../repositories/businessConfigurationRepository");
const updateOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    address: zod_1.z.string().nullable().optional(),
    phone: zod_1.z.string().nullable().optional(),
    email: zod_1.z.string().email('Email inválido').nullable().optional().or(zod_1.z.literal('')),
    currency: zod_1.z.string().optional(),
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
        appointmentSystem: zod_1.z.object({
            appointmentModel: zod_1.z.enum(['professional_based', 'resource_based', 'hybrid']).optional(),
            allowClientSelection: zod_1.z.boolean().optional(),
            bufferBetweenAppointments: zod_1.z.number().optional(),
            maxAdvanceBookingDays: zod_1.z.number().optional(),
            maxProfessionals: zod_1.z.number().min(1).max(50).optional(),
            maxResources: zod_1.z.number().min(1).max(50).optional(),
            professionals: zod_1.z.array(zod_1.z.object({
                id: zod_1.z.string(),
                name: zod_1.z.string(),
                photo: zod_1.z.string().optional(),
                isActive: zod_1.z.boolean(),
            })).optional(),
        }).optional(),
        businessConfiguration: zod_1.z.object({
            appointmentModel: zod_1.z.enum(['professional_based', 'resource_based', 'hybrid']).optional(),
            allowClientSelection: zod_1.z.boolean().optional(),
            bufferBetweenAppointments: zod_1.z.number().optional(),
            maxAdvanceBookingDays: zod_1.z.number().optional(),
            maxProfessionals: zod_1.z.number().min(1).max(50).optional(),
            maxResources: zod_1.z.number().min(1).max(50).optional(),
            professionals: zod_1.z.array(zod_1.z.object({
                id: zod_1.z.string(),
                name: zod_1.z.string(),
                photo: zod_1.z.string().optional(),
                isActive: zod_1.z.boolean(),
            })).optional(),
        }).optional(),
        businessInfo: zod_1.z.object({
            businessName: zod_1.z.string().optional(),
            businessAddress: zod_1.z.string().nullable().optional(),
            businessPhone: zod_1.z.string().nullable().optional(),
            businessEmail: zod_1.z.string().email('Email inválido').nullable().optional().or(zod_1.z.literal('')),
        }).optional(),
        services: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string().optional(),
            name: zod_1.z.string(),
            description: zod_1.z.string().optional(),
            duration: zod_1.z.number().positive('La duración debe ser positiva'),
            price: zod_1.z.number().min(0, 'El precio no puede ser negativo'),
            isActive: zod_1.z.boolean().optional(),
        })).optional(),
        currency: zod_1.z.string().optional(),
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
    }
    catch (error) {
        console.error('Error in getOrganizationService:', error);
        throw new Error(error.message || 'Error obteniendo la organizaci�n');
    }
};
exports.getOrganizationService = getOrganizationService;
const updateOrganizationService = async (orgId, userId, updates) => {
    console.log('🔄 updateOrganizationService called with:');
    console.log('  - orgId:', orgId);
    console.log('  - userId:', userId);
    console.log('  - updates:', JSON.stringify(updates, null, 2));
    const validatedUpdates = updateOrganizationSchema.parse(updates);
    console.log('✅ Validation passed, validated updates:', JSON.stringify(validatedUpdates, null, 2));
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
        const organizationToUpdate = {
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
        const updatedOrganization = await (0, organizationRepository_1.updateOrganization)(orgId, organizationToUpdate);
        // If appointment system or business configuration settings were updated, 
        // also update the business configuration entity
        if (validatedUpdates.settings?.appointmentSystem || validatedUpdates.settings?.businessConfiguration) {
            try {
                const businessConfig = await (0, businessConfigurationRepository_1.getBusinessConfigurationByOrgId)(orgId);
                if (businessConfig) {
                    const businessConfigUpdates = {};
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
                        await (0, businessConfigurationRepository_1.updateBusinessConfiguration)(orgId, businessConfig.id, businessConfigUpdates);
                        console.log(`✅ Business configuration updated for organization: ${orgId}`);
                    }
                }
            }
            catch (error) {
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
