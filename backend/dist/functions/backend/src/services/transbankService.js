"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transbankService = exports.TransbankService = void 0;
const transbank_sdk_1 = require("transbank-sdk");
// Initialize Transbank with environment
const environment = process.env.TRANSBANK_ENVIRONMENT === 'production'
    ? transbank_sdk_1.Environment.Production
    : transbank_sdk_1.Environment.Integration;
const commerceCode = process.env.TRANSBANK_COMMERCE_CODE || '597055555532';
const apiKey = process.env.TRANSBANK_API_KEY || '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';
// Configure Transbank
const tx = new transbank_sdk_1.WebpayPlus.Transaction(new transbank_sdk_1.Options(commerceCode, apiKey, environment));
class TransbankService {
    /**
     * Crea una transacción de Webpay Plus para el plan seleccionado
     */
    async createTransaction(params) {
        try {
            console.log('Creating Transbank transaction with params:', params);
            // Create the transaction
            const response = await tx.create(params.orderId, params.userEmail, // session_id can be user email
            params.amount, params.returnUrl);
            console.log('Transbank transaction created successfully:', response);
            return {
                success: true,
                token: response.token,
                url: response.url,
                orderId: params.orderId,
                amount: params.amount,
            };
        }
        catch (error) {
            console.error('Error creating Transbank transaction:', error);
            throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Confirma una transacción de Webpay Plus
     */
    async confirmTransaction(token) {
        try {
            console.log('Confirming Transbank transaction:', token);
            const response = await tx.commit(token);
            console.log('Transaction confirmed:', response);
            if (response.status === 'AUTHORIZED') {
                return {
                    success: true,
                    transactionDetails: response,
                };
            }
            return { success: false };
        }
        catch (error) {
            console.error('Error confirming transaction:', error);
            throw new Error(`Failed to confirm transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Obtiene el estado de una transacción
     */
    async getTransactionStatus(token) {
        try {
            console.log('Getting transaction status:', token);
            const response = await tx.status(token);
            console.log('Transaction status retrieved:', response);
            return response;
        }
        catch (error) {
            console.error('Error getting transaction status:', error);
            throw new Error(`Failed to get transaction status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Inicia un trial gratuito sin requerir pago inmediato
     */
    async startFreeTrial(planId, organizationId, trialDays, userEmail) {
        try {
            console.log('Starting free trial for organization:', organizationId);
            const now = Math.floor(Date.now() / 1000);
            const trialEnd = now + (trialDays * 24 * 60 * 60);
            const periodEnd = now + (30 * 24 * 60 * 60); // 30 days from now
            // Create subscription without payment for trial
            const subscription = {
                id: `sub_trial_${Date.now()}`,
                organizationId,
                status: 'trialing',
                current_period_start: now,
                current_period_end: periodEnd,
                trial_start: now,
                trial_end: trialEnd,
                cancel_at_period_end: false,
                plan: {
                    id: planId,
                    name: 'Plan Básico',
                    amount: 12990, // $12.990 CLP
                    currency: 'CLP',
                    interval: 'month',
                    interval_count: 1,
                },
                customer: {
                    id: `cus_${organizationId}`,
                    email: userEmail,
                },
            };
            console.log('Free trial started successfully');
            return subscription;
        }
        catch (error) {
            console.error('Error starting free trial:', error);
            throw new Error(`Failed to start free trial: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Cancela una suscripción
     */
    async cancelSubscription(subscriptionId) {
        try {
            console.log('Canceling subscription:', subscriptionId);
            // For Transbank, we handle cancellation in our own system
            // since there's no recurring billing built-in like Stripe
            const now = Math.floor(Date.now() / 1000);
            // This would be retrieved from database in real implementation
            const subscription = {
                id: subscriptionId,
                organizationId: 'placeholder', // Would come from DB
                status: 'canceled',
                current_period_start: now - (30 * 24 * 60 * 60),
                current_period_end: now,
                cancel_at_period_end: true,
                canceled_at: now,
                plan: {
                    id: 'basic',
                    name: 'Plan Básico',
                    amount: 12990,
                    currency: 'CLP',
                    interval: 'month',
                    interval_count: 1,
                },
                customer: {
                    id: 'placeholder',
                    email: 'placeholder@example.com',
                },
            };
            console.log('Subscription canceled successfully');
            return subscription;
        }
        catch (error) {
            console.error('Error canceling subscription:', error);
            throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Genera un plan de pago mensual (para implementar facturación recurrente manual)
     */
    async generateMonthlyBilling(organizationId, planAmount) {
        try {
            console.log('Generating monthly billing for organization:', organizationId);
            const orderId = `monthly_${organizationId}_${Date.now()}`;
            // Create a transaction for monthly payment
            const params = {
                planId: 'basic',
                organizationId,
                userEmail: `billing_${organizationId}@placeholder.com`, // This would come from customer data
                amount: planAmount,
                orderId,
                returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing/success`,
            };
            const result = await this.createTransaction(params);
            console.log('Monthly billing transaction created');
            return result;
        }
        catch (error) {
            console.error('Error generating monthly billing:', error);
            throw new Error(`Failed to generate monthly billing: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Verifica si una transacción fue exitosa
     */
    async verifyPayment(token) {
        try {
            const transactionDetails = await this.getTransactionStatus(token);
            if (transactionDetails.status === 'AUTHORIZED') {
                return {
                    success: true,
                    amount: transactionDetails.amount,
                    orderId: transactionDetails.buy_order,
                };
            }
            return { success: false };
        }
        catch (error) {
            console.error('Error verifying payment:', error);
            throw new Error(`Failed to verify payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Maneja el webhook de confirmación de pago (si implementas uno)
     */
    async handlePaymentConfirmation(token, orderId) {
        try {
            console.log('Processing payment confirmation for:', orderId);
            const verificationResult = await this.verifyPayment(token);
            if (verificationResult.success) {
                // Here you would:
                // 1. Update subscription status to 'active'
                // 2. Extend subscription period
                // 3. Send confirmation email
                const subscription = {
                    id: `sub_${orderId}`,
                    organizationId: orderId.split('_')[1] || 'unknown', // Extract from orderId
                    status: 'active',
                    current_period_start: Math.floor(Date.now() / 1000),
                    current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
                    cancel_at_period_end: false,
                    plan: {
                        id: 'basic',
                        name: 'Plan Básico',
                        amount: verificationResult.amount || 12990,
                        currency: 'CLP',
                        interval: 'month',
                        interval_count: 1,
                    },
                    customer: {
                        id: `cus_${orderId}`,
                        email: 'customer@example.com', // Would come from order data
                    },
                    transbank_data: {
                        orderId: verificationResult.orderId || orderId,
                        transactionId: token,
                    },
                };
                return { handled: true, subscription };
            }
            return { handled: false };
        }
        catch (error) {
            console.error('Error processing payment confirmation:', error);
            throw new Error(`Failed to process payment confirmation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.TransbankService = TransbankService;
exports.transbankService = new TransbankService();
