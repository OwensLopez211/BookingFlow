"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSettingsUpdate = void 0;
const response_1 = require("../utils/response");
const cognito_1 = require("../utils/cognito");
const userRepository_1 = require("../repositories/userRepository");
const organizationService_1 = require("../services/organizationService");
/**
 * Función de prueba para verificar que la actualización de settings funciona correctamente
 */
const testSettingsUpdate = async (event) => {
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
        // Test data - esto simula lo que vendría desde el frontend
        const testSettings = {
            name: 'Test Organization Updated',
            address: 'Test Address 123',
            phone: '+56 9 1234 5678',
            email: 'test@example.com',
            currency: 'CLP',
            settings: {
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
                    businessName: 'Test Business Updated',
                    businessAddress: 'Business Address 456',
                    businessPhone: '+56 9 8765 4321',
                    businessEmail: 'business@example.com'
                },
                services: [
                    {
                        name: 'Test Service 1',
                        description: 'Description for test service 1',
                        duration: 60,
                        price: 25000,
                        isActive: true
                    },
                    {
                        name: 'Test Service 2',
                        description: 'Description for test service 2',
                        duration: 30,
                        price: 15000,
                        isActive: true
                    }
                ]
            }
        };
        console.log('🧪 Testing settings update with data:', JSON.stringify(testSettings, null, 2));
        // Actualizar la organización usando el servicio
        const result = await (0, organizationService_1.updateOrganizationService)(user.orgId, user.id, testSettings);
        return (0, response_1.createResponse)(200, {
            success: true,
            message: 'Settings update test completed successfully',
            testData: testSettings,
            result: result
        });
    }
    catch (error) {
        console.error('❌ Error in testSettingsUpdate:', error);
        return (0, response_1.createResponse)(500, {
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.testSettingsUpdate = testSettingsUpdate;
