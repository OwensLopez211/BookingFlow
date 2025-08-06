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
exports.transbankService = exports.TransbankService = void 0;
const transbank_sdk_1 = require("transbank-sdk");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Load environment variables from .env file if in development
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const envPath = path.join(__dirname, '..', '..', '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    process.env[key.trim()] = value;
                }
            }
        });
    }
}
// Initialize Transbank with environment
const environment = process.env.TRANSBANK_ENVIRONMENT === 'production'
    ? transbank_sdk_1.Environment.Production
    : transbank_sdk_1.Environment.Integration;
// Para ambiente de integración, usar las credenciales de integración de Transbank
// OneClick Mall requiere credenciales específicas diferentes a WebpayPlus
const commerceCode = process.env.TRANSBANK_COMMERCE_CODE || transbank_sdk_1.IntegrationCommerceCodes.ONECLICK_MALL;
const apiKey = process.env.TRANSBANK_API_KEY || transbank_sdk_1.IntegrationApiKeys.WEBPAY;
// Log configuration for debugging
console.log('🔧 Transbank Configuration:');
console.log('  Environment:', environment);
console.log('  Commerce Code:', commerceCode);
console.log('  API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');
// Configure Transbank
const tx = new transbank_sdk_1.WebpayPlus.Transaction(new transbank_sdk_1.Options(commerceCode, apiKey, environment));
// Configure OneClick
const oneClickInscription = new transbank_sdk_1.Oneclick.MallInscription(new transbank_sdk_1.Options(commerceCode, apiKey, environment));
const oneClickTransaction = new transbank_sdk_1.Oneclick.MallTransaction(new transbank_sdk_1.Options(commerceCode, apiKey, environment));
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
    // ============ ONECLICK METHODS ============
    /**
     * Inicia una inscripción OneClick
     */
    async startOneclickInscription(params) {
        try {
            console.log('Starting OneClick inscription with params:', params);
            // Llamada real al SDK de Transbank
            const response = await oneClickInscription.start(params.username, params.email, params.returnUrl);
            console.log('OneClick inscription started successfully:', response);
            return {
                success: true,
                token: response.token,
                urlWebpay: response.url_webpay, // Transbank SDK devuelve url_webpay
            };
        }
        catch (error) {
            console.error('Error starting OneClick inscription:', error);
            throw new Error(`Failed to start OneClick inscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Finaliza una inscripción OneClick
     */
    async finishOneclickInscription(params) {
        try {
            console.log('🔹 Finishing OneClick inscription with token:', params.token.substring(0, 20) + '...');
            console.log('🔹 Token length:', params.token.length);
            // Llamada real al SDK de Transbank
            console.log('🔹 Calling oneClickInscription.finish...');
            const response = await oneClickInscription.finish(params.token);
            console.log('🔹 OneClick inscription response:', {
                response_code: response.response_code,
                responseCode: response.responseCode, // Check both formats
                tbk_user: response.tbk_user,
                tbkUser: response.tbkUser, // Check both formats
                authorization_code: response.authorization_code,
                authorizationCode: response.authorizationCode, // Check both formats
                card_type: response.card_type,
                cardType: response.cardType, // Check both formats
                card_number: response.card_number,
                cardNumber: response.cardNumber // Check both formats
            });
            // Transbank SDK uses snake_case, not camelCase
            const responseCode = response.response_code ?? response.responseCode ?? -1;
            if (responseCode === 0) {
                console.log('✅ OneClick inscription successful');
                return {
                    success: true,
                    tbkUser: response.tbk_user || response.tbkUser,
                    authorizationCode: response.authorization_code || response.authorizationCode,
                    cardType: response.card_type || response.cardType,
                    cardNumber: response.card_number || response.cardNumber,
                };
            }
            console.warn('⚠️ OneClick inscription failed with response_code:', responseCode);
            return {
                success: false,
                tbkUser: response.tbk_user || response.tbkUser
            };
        }
        catch (error) {
            console.error('❌ Error finishing OneClick inscription:', error);
            console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
            console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            throw new Error(`Failed to finish OneClick inscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Elimina una inscripción OneClick
     */
    async removeOneclickInscription(tbkUser, username) {
        try {
            console.log('Removing OneClick inscription:', { tbkUser, username });
            const response = await oneClickInscription.delete(tbkUser, username);
            console.log('OneClick inscription removed successfully:', response);
            return { success: true };
        }
        catch (error) {
            console.error('Error removing OneClick inscription:', error);
            throw new Error(`Failed to remove OneClick inscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Ejecuta un cobro OneClick
     */
    async chargeOneclick(params) {
        try {
            console.log('Charging OneClick with params:', params);
            // Llamada real al SDK de Transbank para OneClick Mall
            // OneClick Mall requiere un array de detalles de transacción
            const transactionDetails = [
                new transbank_sdk_1.TransactionDetail(params.amount, commerceCode, params.buyOrder, 1)
            ];
            const response = await oneClickTransaction.authorize(params.username, params.tbkUser, params.buyOrder, transactionDetails);
            console.log('OneClick charge executed successfully:', response);
            if (response.responseCode === 0) {
                return {
                    success: true,
                    authorizationCode: response.authorizationCode,
                    buyOrder: response.buyOrder,
                    cardNumber: response.cardNumber,
                    amount: response.amount,
                    transactionDate: response.transactionDate,
                    installmentsNumber: response.installmentsNumber,
                };
            }
            return {
                success: false,
                authorizationCode: response.authorizationCode,
                buyOrder: response.buyOrder
            };
        }
        catch (error) {
            console.error('Error charging OneClick:', error);
            throw new Error(`Failed to charge OneClick: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Inicia un trial con OneClick configurado para cobro automático al vencer
     */
    async startTrialWithOneclickInscription(planId, organizationId, trialDays, userEmail, oneclickUsername, returnUrl) {
        try {
            console.log('Starting trial with OneClick for organization:', organizationId);
            // 1. Iniciar inscripción OneClick (cobro de $1 peso para validar tarjeta)
            const oneclickInscription = await this.startOneclickInscription({
                username: oneclickUsername,
                email: userEmail,
                returnUrl: returnUrl,
            });
            if (!oneclickInscription.success) {
                throw new Error('Failed to start OneClick inscription');
            }
            // 2. Crear suscripción en trial con datos OneClick
            const now = Math.floor(Date.now() / 1000);
            const trialEnd = now + (trialDays * 24 * 60 * 60);
            const periodEnd = now + (30 * 24 * 60 * 60); // 30 days from now
            const subscription = {
                id: `sub_trial_oneclick_${Date.now()}`,
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
                    amount: 14990, // $14.990 CLP 
                    currency: 'CLP',
                    interval: 'month',
                    interval_count: 1,
                },
                customer: {
                    id: `cus_${organizationId}`,
                    email: userEmail,
                },
                transbank_data: {
                    orderId: `trial_${organizationId}_${Date.now()}`,
                },
            };
            console.log('Trial with OneClick started successfully');
            return {
                success: true,
                subscription,
                oneclick: oneclickInscription
            };
        }
        catch (error) {
            console.error('Error starting trial with OneClick:', error);
            throw new Error(`Failed to start trial with OneClick: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.TransbankService = TransbankService;
exports.transbankService = new TransbankService();
