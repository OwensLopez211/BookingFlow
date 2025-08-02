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
exports.testCompleteSettingsUpdate = void 0;
const response_1 = require("../utils/response");
const cognito_1 = require("../utils/cognito");
const userRepository_1 = require("../repositories/userRepository");
const organizationRepository_1 = require("../repositories/organizationRepository");
/**
 * Endpoint para probar la actualización completa de settings
 * Simula exactamente lo que envía el frontend
 */
const testCompleteSettingsUpdate = async (event) => {
    try {
        const token = event.headers.Authorization?.replace('Bearer ', '');
        if (!token) {
            return (0, response_1.createResponse)(401, { error: 'Token is required' });
        }
        const decoded = await (0, cognito_1.verifyToken)(token);
        if (!decoded) {
            return (0, response_1.createResponse)(401, { error: 'Invalid token' });
        }
        const user = await (0, userRepository_1.getUserByCognitoId)(decoded.username);
        if (!user) {
            return (0, response_1.createResponse)(404, { error: 'User not found' });
        }
        if (!user.orgId) {
            return (0, response_1.createResponse)(400, { error: 'User is not associated with an organization' });
        }
        if (user.role !== 'owner') {
            return (0, response_1.createResponse)(403, { error: 'Only owners can test settings update' });
        }
        // Obtener organización actual
        const currentOrg = await (0, organizationRepository_1.getOrganizationById)(user.orgId);
        if (!currentOrg) {
            return (0, response_1.createResponse)(404, { error: 'Organization not found' });
        }
        console.log('📋 Current organization:', JSON.stringify(currentOrg, null, 2));
        // Simular exactamente los datos que envía el frontend
        const frontendData = {
            // Datos básicos de la organización (extraídos de businessInfo)
            name: 'Mi Negocio Actualizado',
            address: 'Calle Nueva 123, Santiago',
            phone: '+56 9 8765 4321',
            email: 'contacto@minegocio.com',
            currency: 'CLP',
            // Settings
            timezone: 'America/Santiago',
            businessHours: {
                monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
                saturday: { isOpen: true, openTime: '10:00', closeTime: '14:00' },
                sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' }
            },
            notifications: {
                emailReminders: true,
                smsReminders: false,
                autoConfirmation: true,
                reminderHours: 24
            },
            appointmentSystem: {
                appointmentModel: 'professional_based',
                allowClientSelection: true,
                bufferBetweenAppointments: 15,
                maxAdvanceBookingDays: 30
            },
            businessInfo: {
                businessName: 'Mi Negocio Actualizado',
                businessAddress: 'Calle Nueva 123, Santiago',
                businessPhone: '+56 9 8765 4321',
                businessEmail: 'contacto@minegocio.com'
            },
            services: [
                {
                    id: 'service_1',
                    name: 'Servicio Premium',
                    description: 'Servicio premium con todos los beneficios',
                    duration: 90,
                    price: 35000,
                    isActive: true
                },
                {
                    id: 'service_2',
                    name: 'Servicio Básico',
                    description: 'Servicio básico estándar',
                    duration: 60,
                    price: 20000,
                    isActive: true
                },
                {
                    name: 'Servicio Nuevo',
                    description: 'Nuevo servicio sin ID previo',
                    duration: 45,
                    price: 15000,
                    isActive: true
                }
            ]
        };
        console.log('📦 Frontend data to send:', JSON.stringify(frontendData, null, 2));
        // Simular el procesamiento del endpoint (como lo hace organizations.ts)
        const organizationData = {};
        const settingsData = {};
        // Extract organization-level fields
        if (frontendData.name)
            organizationData.name = frontendData.name;
        if (frontendData.address !== undefined)
            organizationData.address = frontendData.address;
        if (frontendData.phone !== undefined)
            organizationData.phone = frontendData.phone;
        if (frontendData.email !== undefined)
            organizationData.email = frontendData.email;
        if (frontendData.currency !== undefined)
            organizationData.currency = frontendData.currency;
        // Extract settings fields
        if (frontendData.timezone)
            settingsData.timezone = frontendData.timezone;
        if (frontendData.businessHours)
            settingsData.businessHours = frontendData.businessHours;
        if (frontendData.notifications)
            settingsData.notifications = frontendData.notifications;
        if (frontendData.appointmentSystem)
            settingsData.appointmentSystem = frontendData.appointmentSystem;
        if (frontendData.businessInfo)
            settingsData.businessInfo = frontendData.businessInfo;
        if (frontendData.services)
            settingsData.services = frontendData.services;
        // Combine data
        const updateData = {
            ...organizationData,
            ...(Object.keys(settingsData).length > 0 && { settings: settingsData })
        };
        console.log('📦 Structured update data:', JSON.stringify(updateData, null, 2));
        // Usar el servicio de actualización
        const { updateOrganizationService } = await Promise.resolve().then(() => __importStar(require('../services/organizationService')));
        const result = await updateOrganizationService(user.orgId, user.id, updateData);
        console.log('✅ Update result:', JSON.stringify(result, null, 2));
        return (0, response_1.createResponse)(200, {
            success: true,
            message: 'Complete settings update test completed successfully',
            currentOrganization: currentOrg,
            frontendData: frontendData,
            structuredData: updateData,
            result: result
        });
    }
    catch (error) {
        console.error('❌ Error in testCompleteSettingsUpdate:', error);
        return (0, response_1.createResponse)(500, {
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
    }
};
exports.testCompleteSettingsUpdate = testCompleteSettingsUpdate;
