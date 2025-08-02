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
    payment_method: 'transbank' | 'manual';
    last_payment_date?: number;
    next_billing_date?: number;
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
    payment_method: 'transbank' | 'manual';
    last_payment_date?: number;
    next_billing_date?: number;
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
    payment_method?: 'transbank' | 'manual';
    last_payment_date?: number;
    next_billing_date?: number;
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
    getSubscriptionByOrganizationId(organizationId: string): Promise<Subscription | null>;
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
