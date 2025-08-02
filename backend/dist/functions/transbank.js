"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const transbankService_1 = require("../services/transbankService");
const authService_1 = require("../services/authService");
const subscriptionRepository_1 = require("../repositories/subscriptionRepository");
const response_1 = require("../utils/response");
const requestMetrics_1 = require("../middleware/requestMetrics");
const extractUserFromToken = async (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Token de acceso requerido');
    }
    const accessToken = authHeader.substring(7);
    const result = await (0, authService_1.getCurrentUserService)(accessToken);
    if (!result.success || !result.user) {
        throw new Error('Token inválido o usuario no encontrado');
    }
    return result.user;
};
const transbankHandler = async (event) => {
    console.log('=== TRANSBANK HANDLER ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    try {
        const { httpMethod, path, body, headers } = event;
        // Handle CORS preflight
        if (httpMethod === 'OPTIONS') {
            return (0, response_1.createResponse)(200);
        }
        // Parse request body if present
        let requestData = {};
        if (body) {
            try {
                requestData = JSON.parse(body);
            }
            catch (error) {
                console.error('Error parsing request body:', error);
                return (0, response_1.errorResponse)('Invalid JSON in request body', 400);
            }
        }
        // Extract user from token for protected endpoints
        const authHeader = headers.Authorization || headers.authorization;
        let currentUser;
        try {
            currentUser = await extractUserFromToken(authHeader);
        }
        catch (error) {
            return (0, response_1.unauthorizedResponse)(error.message);
        }
        // CREATE PAYMENT TRANSACTION - DESHABILITADO TEMPORALMENTE
        if (path?.endsWith('/transbank/create-transaction') && httpMethod === 'POST') {
            console.log('=== CREATE PAYMENT TRANSACTION - DISABLED ===');
            return (0, response_1.errorResponse)('Los pagos están temporalmente deshabilitados. Solo se permite el registro con mes gratuito.', 400);
        }
        // CONFIRM PAYMENT TRANSACTION - DESHABILITADO TEMPORALMENTE
        if (path?.endsWith('/transbank/confirm-transaction') && httpMethod === 'POST') {
            console.log('=== CONFIRM PAYMENT TRANSACTION - DISABLED ===');
            return (0, response_1.errorResponse)('Los pagos están temporalmente deshabilitados.', 400);
        }
        // VERIFY PAYMENT - DESHABILITADO TEMPORALMENTE
        if (path?.match(/\/transbank\/verify-payment\/(.+)$/) && httpMethod === 'GET') {
            console.log('=== VERIFY PAYMENT - DISABLED ===');
            return (0, response_1.errorResponse)('Los pagos están temporalmente deshabilitados.', 400);
        }
        // GET SUBSCRIPTION STATUS
        if (path?.match(/\/transbank\/subscription\/(.+)$/) && httpMethod === 'GET') {
            console.log('=== GET SUBSCRIPTION STATUS ===');
            const organizationId = path.split('/').pop();
            if (!organizationId) {
                return (0, response_1.errorResponse)('Organization ID requerido', 400);
            }
            // Verify user has access to organization
            if (currentUser.orgId !== organizationId) {
                return (0, response_1.unauthorizedResponse)('No tienes permisos para esta organización');
            }
            try {
                // Get subscription from our database
                const subscription = await subscriptionRepository_1.subscriptionRepository.getByOrganizationId(organizationId);
                if (!subscription) {
                    return (0, response_1.successResponse)(null, 'No subscription found');
                }
                // Format subscription data for frontend
                const formattedSubscription = {
                    id: subscription.id,
                    status: subscription.status,
                    current_period_end: subscription.current_period_end,
                    trial_end: subscription.trial_end,
                    plan: {
                        id: subscription.plan_id || 'basic',
                        name: 'Plan Básico',
                        amount: 12990,
                        currency: 'CLP',
                        interval: 'month'
                    }
                };
                return (0, response_1.successResponse)(formattedSubscription, 'Estado de suscripción obtenido exitosamente');
            }
            catch (error) {
                console.error('Error getting subscription:', error);
                return (0, response_1.serverErrorResponse)(`Error obteniendo suscripción: ${error.message}`);
            }
        }
        // CANCEL SUBSCRIPTION
        if (path?.endsWith('/transbank/cancel-subscription') && httpMethod === 'POST') {
            console.log('=== CANCEL SUBSCRIPTION ===');
            const { organizationId } = requestData;
            if (!organizationId) {
                return (0, response_1.errorResponse)('Organization ID requerido', 400);
            }
            // Verify user has access to organization and is owner
            if (currentUser.orgId !== organizationId || currentUser.role !== 'owner') {
                return (0, response_1.unauthorizedResponse)('Solo los propietarios pueden cancelar suscripciones');
            }
            try {
                const subscriptionId = `sub_${organizationId}`; // This would come from DB
                const result = await transbankService_1.transbankService.cancelSubscription(subscriptionId);
                return (0, response_1.successResponse)({ success: true, subscription: result }, 'Suscripción cancelada exitosamente');
            }
            catch (error) {
                console.error('Error canceling subscription:', error);
                return (0, response_1.serverErrorResponse)(`Error cancelando suscripción: ${error.message}`);
            }
        }
        // START FREE TRIAL
        if (path?.endsWith('/transbank/start-free-trial') && httpMethod === 'POST') {
            console.log('=== START FREE TRIAL ===');
            const { planId, organizationId, trialDays } = requestData;
            if (!planId || !organizationId || !trialDays) {
                return (0, response_1.errorResponse)('Plan ID, Organization ID y trial days requeridos', 400);
            }
            // Verify user has access to organization
            if (currentUser.orgId !== organizationId) {
                return (0, response_1.unauthorizedResponse)('No tienes permisos para esta organización');
            }
            try {
                // Check if organization already has a subscription
                // This would check the subscription repository
                const subscription = await transbankService_1.transbankService.startFreeTrial(planId, organizationId, trialDays, currentUser.email);
                return (0, response_1.successResponse)({
                    success: true,
                    subscription
                }, 'Prueba gratuita iniciada exitosamente');
            }
            catch (error) {
                console.error('Error starting free trial:', error);
                return (0, response_1.serverErrorResponse)(`Error iniciando prueba gratuita: ${error.message}`);
            }
        }
        // GENERATE MONTHLY BILLING - DESHABILITADO TEMPORALMENTE
        if (path?.endsWith('/transbank/generate-billing') && httpMethod === 'POST') {
            console.log('=== GENERATE MONTHLY BILLING - DISABLED ===');
            return (0, response_1.errorResponse)('La facturación automática está temporalmente deshabilitada.', 400);
        }
        // PAYMENT CONFIRMATION WEBHOOK - DESHABILITADO TEMPORALMENTE
        if (path?.endsWith('/transbank/payment-confirmation') && httpMethod === 'POST') {
            console.log('=== PAYMENT CONFIRMATION WEBHOOK - DISABLED ===');
            return (0, response_1.errorResponse)('Los pagos están temporalmente deshabilitados.', 400);
        }
        // Route not found
        console.log('Route not found:', path, httpMethod);
        return (0, response_1.errorResponse)('Endpoint no encontrado', 404);
    }
    catch (error) {
        console.error('=== TRANSBANK HANDLER ERROR ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        // Handle known errors
        if (error.message.includes('No tienes permisos')) {
            return (0, response_1.unauthorizedResponse)(error.message);
        }
        if (error.message.includes('no encontrado') || error.message.includes('no encontrada')) {
            return (0, response_1.errorResponse)(error.message, 404);
        }
        if (error.message.includes('Token')) {
            return (0, response_1.unauthorizedResponse)(error.message);
        }
        if (error.message.includes('requerido')) {
            return (0, response_1.errorResponse)(error.message, 400);
        }
        // Generic server error
        return (0, response_1.serverErrorResponse)(`Error interno del servidor: ${error.message}`);
    }
};
exports.handler = (0, requestMetrics_1.withMetrics)(transbankHandler, { trackUser: true });
