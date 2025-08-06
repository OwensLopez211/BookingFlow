export interface Subscription {
    id: string;
    organizationId: string;
    transbankOrderId?: string;
    transbankTransactionId?: string;
    customerId: string;
    planId: string;
    planName: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
    current_period_start: number;
    current_period_end: number;
    trial_start?: number;
    trial_end?: number;
    cancel_at_period_end: boolean;
    canceled_at?: number;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    payment_method: 'transbank' | 'transbank_oneclick' | 'manual';
    last_payment_date?: number;
    next_billing_date?: number;
    oneclick_user_id?: string;
    oneclick_username?: string;
    oneclick_inscription_token?: string;
    oneclick_inscription_date?: number;
    oneclick_active: boolean;
    payment_attempts: number;
    last_payment_attempt?: number;
    retry_payment_at?: number;
    createdAt: string;
    updatedAt: string;
}
export interface CreateSubscriptionData {
    organizationId: string;
    transbankOrderId?: string;
    transbankTransactionId?: string;
    customerId: string;
    planId: string;
    planName: string;
    status: Subscription['status'];
    current_period_start: number;
    current_period_end: number;
    trial_start?: number;
    trial_end?: number;
    cancel_at_period_end?: boolean;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    payment_method: 'transbank' | 'transbank_oneclick' | 'manual';
    last_payment_date?: number;
    next_billing_date?: number;
    oneclick_user_id?: string;
    oneclick_username?: string;
    oneclick_inscription_token?: string;
    oneclick_inscription_date?: number;
    oneclick_active?: boolean;
    payment_attempts?: number;
    last_payment_attempt?: number;
    retry_payment_at?: number;
}
export interface UpdateSubscriptionData {
    status?: Subscription['status'];
    current_period_start?: number;
    current_period_end?: number;
    trial_start?: number;
    trial_end?: number;
    cancel_at_period_end?: boolean;
    canceled_at?: number;
    amount?: number;
    currency?: string;
    interval?: 'month' | 'year';
    transbankOrderId?: string;
    transbankTransactionId?: string;
    payment_method?: 'transbank' | 'transbank_oneclick' | 'manual';
    last_payment_date?: number;
    next_billing_date?: number;
    oneclick_user_id?: string;
    oneclick_username?: string;
    oneclick_inscription_token?: string;
    oneclick_inscription_date?: number;
    oneclick_active?: boolean;
    payment_attempts?: number;
    last_payment_attempt?: number;
    retry_payment_at?: number;
}
export declare class SubscriptionRepository {
    /**
     * Crea una nueva suscripción
     */
    createSubscription(data: CreateSubscriptionData): Promise<Subscription>;
    /**
     * Obtiene una suscripción por ID
     */
    getSubscriptionById(id: string): Promise<Subscription | null>;
    /**
     * Obtiene una suscripción por Organization ID
     */
    getByOrganizationId(organizationId: string): Promise<Subscription | null>;
    /**
     * Obtiene una suscripción por Transbank Order ID
     */
    getSubscriptionByTransbankOrderId(transbankOrderId: string): Promise<Subscription | null>;
    /**
     * Actualiza una suscripción
     */
    updateSubscription(id: string, updates: UpdateSubscriptionData): Promise<Subscription>;
    /**
     * Cancela una suscripción (soft delete)
     */
    cancelSubscription(id: string): Promise<Subscription>;
    /**
     * Elimina una suscripción (hard delete)
     */
    deleteSubscription(id: string): Promise<void>;
    /**
     * Lista todas las suscripciones activas que expiran en X días
     */
    getExpiringSubscriptions(daysFromNow: number): Promise<Subscription[]>;
    /**
     * Obtiene suscripciones que necesitan ser cobradas (trials que expiran)
     */
    getTrialsExpiring(daysFromNow?: number): Promise<Subscription[]>;
    /**
     * Obtiene suscripciones con pagos fallidos que necesitan reintento
     */
    getSubscriptionsForRetry(): Promise<Subscription[]>;
    /**
     * Actualiza el contador de intentos de pago
     */
    updatePaymentAttempt(subscriptionId: string, success: boolean): Promise<Subscription>;
    /**
     * Obtiene estadísticas de suscripciones
     */
    getSubscriptionStats(): Promise<{
        total: number;
        active: number;
        trialing: number;
        canceled: number;
        past_due: number;
    }>;
}
export declare const subscriptionRepository: SubscriptionRepository;
