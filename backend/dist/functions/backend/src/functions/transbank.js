"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const transbankService_1 = require("../services/transbankService");
const authService_1 = require("../services/authService");
const organizationService_1 = require("../services/organizationService");
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
        // CREATE PAYMENT TRANSACTION
        if (path?.endsWith('/transbank/create-transaction') && httpMethod === 'POST') {
            console.log('=== CREATE PAYMENT TRANSACTION ===');
            const { planId, organizationId, amount, returnUrl } = requestData;
            if (!planId || !organizationId || !amount || !returnUrl) {
                return (0, response_1.errorResponse)('Missing required fields: planId, organizationId, amount, returnUrl', 400);
            }
            // Verify user has access to organization
            if (currentUser.orgId !== organizationId) {
                return (0, response_1.unauthorizedResponse)('No tienes permisos para esta organización');
            }
            // Get organization to get user email
            const orgResult = await (0, organizationService_1.getOrganizationService)(organizationId, currentUser.id);
            if (!orgResult.success) {
                return (0, response_1.errorResponse)('Organización no encontrada', 404);
            }
            try {
                const orderId = `plan_${planId}_${organizationId}_${Date.now()}`;
                const result = await transbankService_1.transbankService.createTransaction({
                    planId,
                    organizationId,
                    userEmail: currentUser.email,
                    amount,
                    orderId,
                    returnUrl,
                });
                return (0, response_1.successResponse)({
                    orderId: result.orderId,
                    token: result.token,
                    url: result.url,
                    amount: result.amount,
                }, 'Transacción creada exitosamente');
            }
            catch (error) {
                console.error('Error creating transaction:', error);
                return (0, response_1.serverErrorResponse)(`Error creando transacción: ${error.message}`);
            }
        }
        // CONFIRM PAYMENT TRANSACTION
        if (path?.endsWith('/transbank/confirm-transaction') && httpMethod === 'POST') {
            console.log('=== CONFIRM PAYMENT TRANSACTION ===');
            const { token } = requestData;
            if (!token) {
                return (0, response_1.errorResponse)('Token is required', 400);
            }
            try {
                const result = await transbankService_1.transbankService.confirmTransaction(token);
                return (0, response_1.successResponse)(result, 'Transacción confirmada exitosamente');
            }
            catch (error) {
                console.error('Error confirming transaction:', error);
                return (0, response_1.serverErrorResponse)(`Error confirmando transacción: ${error.message}`);
            }
        }
        // VERIFY PAYMENT
        if (path?.match(/\/transbank\/verify-payment\/(.+)$/) && httpMethod === 'GET') {
            console.log('=== VERIFY PAYMENT ===');
            const token = path.split('/').pop();
            if (!token) {
                return (0, response_1.errorResponse)('Token requerido', 400);
            }
            try {
                const result = await transbankService_1.transbankService.verifyPayment(token);
                return (0, response_1.successResponse)(result, 'Pago verificado exitosamente');
            }
            catch (error) {
                console.error('Error verifying payment:', error);
                return (0, response_1.serverErrorResponse)(`Error verificando pago: ${error.message}`);
            }
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
                // For Transbank, we need to check our own subscription database
                // This would integrate with the subscription repository
                const subscription = null; // Would get from subscriptionRepository
                return (0, response_1.successResponse)(subscription, 'Estado de suscripción obtenido exitosamente');
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
        // GENERATE MONTHLY BILLING
        if (path?.endsWith('/transbank/generate-billing') && httpMethod === 'POST') {
            console.log('=== GENERATE MONTHLY BILLING ===');
            const { organizationId, amount, returnUrl } = requestData;
            if (!organizationId || !amount || !returnUrl) {
                return (0, response_1.errorResponse)('Organization ID, amount y return URL requeridos', 400);
            }
            // Verify user has access to organization
            if (currentUser.orgId !== organizationId) {
                return (0, response_1.unauthorizedResponse)('No tienes permisos para esta organización');
            }
            try {
                const result = await transbankService_1.transbankService.generateMonthlyBilling(organizationId, amount);
                return (0, response_1.successResponse)(result, 'Facturación mensual generada exitosamente');
            }
            catch (error) {
                console.error('Error generating billing:', error);
                return (0, response_1.serverErrorResponse)(`Error generando facturación: ${error.message}`);
            }
        }
        // PAYMENT CONFIRMATION WEBHOOK
        if (path?.endsWith('/transbank/payment-confirmation') && httpMethod === 'POST') {
            console.log('=== PAYMENT CONFIRMATION WEBHOOK ===');
            const { token, orderId } = requestData;
            if (!token || !orderId) {
                return (0, response_1.errorResponse)('Token y Order ID requeridos', 400);
            }
            try {
                const result = await transbankService_1.transbankService.handlePaymentConfirmation(token, orderId);
                return (0, response_1.successResponse)(result, 'Confirmación de pago procesada exitosamente');
            }
            catch (error) {
                console.error('Error processing payment confirmation:', error);
                return (0, response_1.serverErrorResponse)(`Error procesando confirmación: ${error.message}`);
            }
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
