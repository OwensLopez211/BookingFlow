export interface CreateTransactionParams {
    planId: string;
    organizationId: string;
    userEmail: string;
    amount: number;
    orderId: string;
    returnUrl: string;
}
export interface SubscriptionInfo {
    id: string;
    organizationId: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
    current_period_start: number;
    current_period_end: number;
    trial_start?: number;
    trial_end?: number;
    cancel_at_period_end: boolean;
    canceled_at?: number;
    plan: {
        id: string;
        name: string;
        amount: number;
        currency: string;
        interval: string;
        interval_count: number;
    };
    customer: {
        id: string;
        email: string;
    };
    transbank_data?: {
        orderId: string;
        transactionId?: string;
        buyOrder?: string;
    };
}
export interface TransactionResult {
    success: boolean;
    token?: string;
    url?: string;
    orderId: string;
    amount: number;
}
export declare class TransbankService {
    /**
     * Crea una transacción de Webpay Plus para el plan seleccionado
     */
    createTransaction(params: CreateTransactionParams): Promise<TransactionResult>;
    /**
     * Confirma una transacción de Webpay Plus
     */
    confirmTransaction(token: string): Promise<{
        success: boolean;
        transactionDetails?: any;
    }>;
    /**
     * Obtiene el estado de una transacción
     */
    getTransactionStatus(token: string): Promise<any>;
    /**
     * Inicia un trial gratuito sin requerir pago inmediato
     */
    startFreeTrial(planId: string, organizationId: string, trialDays: number, userEmail: string): Promise<SubscriptionInfo>;
    /**
     * Cancela una suscripción
     */
    cancelSubscription(subscriptionId: string): Promise<SubscriptionInfo>;
    /**
     * Genera un plan de pago mensual (para implementar facturación recurrente manual)
     */
    generateMonthlyBilling(organizationId: string, planAmount: number): Promise<TransactionResult>;
    /**
     * Verifica si una transacción fue exitosa
     */
    verifyPayment(token: string): Promise<{
        success: boolean;
        amount?: number;
        orderId?: string;
    }>;
    /**
     * Maneja el webhook de confirmación de pago (si implementas uno)
     */
    handlePaymentConfirmation(token: string, orderId: string): Promise<{
        handled: boolean;
        subscription?: SubscriptionInfo;
    }>;
}
export declare const transbankService: TransbankService;
