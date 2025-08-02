"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableSlots = exports.generateOrganizationAvailability = exports.getIndustryTemplates = exports.initializeBusinessConfiguration = exports.updateBusinessConfiguration = exports.getBusinessConfiguration = exports.createBusinessConfiguration = void 0;
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const businessConfigRepo = __importStar(require("../repositories/businessConfigurationRepository"));
const availabilityService = __importStar(require("../services/availabilityService"));
const createBusinessConfiguration = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const configData = JSON.parse(event.body || '{}');
        const config = await businessConfigRepo.createBusinessConfiguration({
            orgId: user.orgId,
            ...configData,
        });
        return (0, response_1.createResponse)(201, {
            message: 'Business configuration created successfully',
            data: config
        });
    }
    catch (error) {
        console.error('Create business configuration error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.createBusinessConfiguration = createBusinessConfiguration;
const getBusinessConfiguration = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const config = await businessConfigRepo.getBusinessConfigurationByOrgId(user.orgId);
        if (!config) {
            // Return default configuration if none exists
            const defaultConfig = businessConfigRepo.getDefaultBusinessConfiguration(user.orgId, 'custom');
            return (0, response_1.createResponse)(200, { data: defaultConfig });
        }
        return (0, response_1.createResponse)(200, { data: config });
    }
    catch (error) {
        console.error('Get business configuration error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getBusinessConfiguration = getBusinessConfiguration;
const updateBusinessConfiguration = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const configId = event.pathParameters?.id;
        if (!configId) {
            return (0, response_1.createResponse)(400, { error: 'Configuration ID is required' });
        }
        const updates = JSON.parse(event.body || '{}');
        const config = await businessConfigRepo.updateBusinessConfiguration(user.orgId, configId, updates);
        return (0, response_1.createResponse)(200, {
            message: 'Business configuration updated successfully',
            data: config
        });
    }
    catch (error) {
        console.error('Update business configuration error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.updateBusinessConfiguration = updateBusinessConfiguration;
const initializeBusinessConfiguration = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const { industryType } = JSON.parse(event.body || '{}');
        if (!industryType) {
            return (0, response_1.createResponse)(400, { error: 'Industry type is required' });
        }
        // Check if configuration already exists
        const existingConfig = await businessConfigRepo.getBusinessConfigurationByOrgId(user.orgId);
        if (existingConfig) {
            return (0, response_1.createResponse)(400, { error: 'Business configuration already exists' });
        }
        // Create default configuration for the industry
        const defaultConfigData = businessConfigRepo.getDefaultBusinessConfiguration(user.orgId, industryType);
        const config = await businessConfigRepo.createBusinessConfiguration(defaultConfigData);
        return (0, response_1.createResponse)(201, {
            message: 'Business configuration initialized successfully',
            data: config
        });
    }
    catch (error) {
        console.error('Initialize business configuration error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.initializeBusinessConfiguration = initializeBusinessConfiguration;
const getIndustryTemplates = async (event) => {
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
        return (0, response_1.createResponse)(200, { data: templates });
    }
    catch (error) {
        console.error('Get industry templates error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getIndustryTemplates = getIndustryTemplates;
const generateOrganizationAvailability = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const { startDate, endDate, slotDuration = 30, override = false } = JSON.parse(event.body || '{}');
        if (!startDate || !endDate) {
            return (0, response_1.createResponse)(400, { error: 'Start date and end date are required' });
        }
        await availabilityService.generateAvailabilityForOrganization(user.orgId, {
            startDate,
            endDate,
            slotDuration,
            override,
        });
        return (0, response_1.createResponse)(200, { message: 'Organization availability generated successfully' });
    }
    catch (error) {
        console.error('Generate organization availability error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.generateOrganizationAvailability = generateOrganizationAvailability;
const getAvailableSlots = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const queryParams = event.queryStringParameters || {};
        const { date, duration, entityType, entityId, specialty } = queryParams;
        if (!date || !duration) {
            return (0, response_1.createResponse)(400, { error: 'Date and duration are required' });
        }
        const requiredSpecialties = specialty ? specialty.split(',') : [];
        const availableSlots = await availabilityService.findAvailableSlots(user.orgId, date, parseInt(duration), entityType, entityId, requiredSpecialties);
        return (0, response_1.createResponse)(200, { data: availableSlots });
    }
    catch (error) {
        console.error('Get available slots error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getAvailableSlots = getAvailableSlots;
