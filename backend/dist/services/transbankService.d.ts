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
export interface OneClickInscriptionParams {
    username: string;
    email: string;
    returnUrl: string;
}
export interface OneClickInscriptionResult {
    success: boolean;
    token?: string;
    urlWebpay?: string;
    tbkUser?: string;
}
export interface OneClickFinishInscriptionParams {
    token: string;
}
export interface OneClickFinishInscriptionResult {
    success: boolean;
    tbkUser?: string;
    authorizationCode?: string;
    cardType?: string;
    cardNumber?: string;
}
export interface OneClickChargeParams {
    username: string;
    tbkUser: string;
    buyOrder: string;
    amount: number;
    childCommerceCode?: string;
}
export interface OneClickChargeResult {
    success: boolean;
    authorizationCode?: string;
    buyOrder?: string;
    cardNumber?: string;
    amount?: number;
    transactionDate?: string;
    installmentsNumber?: number;
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
    /**
     * Inicia una inscripción OneClick
     */
    startOneclickInscription(params: OneClickInscriptionParams): Promise<OneClickInscriptionResult>;
    /**
     * Finaliza una inscripción OneClick
     */
    finishOneclickInscription(params: OneClickFinishInscriptionParams): Promise<OneClickFinishInscriptionResult>;
    /**
     * Elimina una inscripción OneClick
     */
    removeOneclickInscription(tbkUser: string, username: string): Promise<{
        success: boolean;
    }>;
    /**
     * Ejecuta un cobro OneClick
     */
    chargeOneclick(params: OneClickChargeParams): Promise<OneClickChargeResult>;
    /**
     * Inicia un trial con OneClick configurado para cobro automático al vencer
     */
    startTrialWithOneclickInscription(planId: string, organizationId: string, trialDays: number, userEmail: string, oneclickUsername: string, returnUrl: string): Promise<{
        success: boolean;
        subscription?: SubscriptionInfo;
        oneclick?: OneClickInscriptionResult;
    }>;
}
export declare const transbankService: TransbankService;
