export interface Subscription {
    id: string;
    organizationId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
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
    createdAt: string;
    updatedAt: string;
}
export interface CreateSubscriptionData {
    organizationId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
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
}
export declare class MockSubscriptionRepository {
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
     * Obtiene una suscripción por Stripe Subscription ID
     */
    getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null>;
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
    /**
     * Clear all subscriptions (for testing)
     */
    clearAll(): Promise<void>;
}
export declare const mockSubscriptionRepository: MockSubscriptionRepository;
