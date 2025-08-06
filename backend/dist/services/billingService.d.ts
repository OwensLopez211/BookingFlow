import { CriticalAlert } from './alertService';
export interface BillingAttempt {
    subscriptionId: string;
    amount: number;
    currency: string;
    attemptNumber: number;
    success: boolean;
    errorMessage?: string;
    transactionId?: string;
    timestamp: number;
}
export interface NotificationEvent {
    type: 'trial_ending' | 'payment_success' | 'payment_failed' | 'subscription_canceled';
    subscriptionId: string;
    organizationId: string;
    customerEmail: string;
    data: Record<string, any>;
    timestamp: number;
}
export declare class BillingService {
    /**
     * Procesa todos los trials que vencen en 1 día y envía notificaciones
     */
    processTrialsEndingTomorrow(): Promise<{
        processed: number;
        notifications: NotificationEvent[];
        errors: string[];
    }>;
    /**
     * Procesa todos los trials que han vencido y ejecuta cobros OneClick
     */
    processExpiredTrials(): Promise<{
        processed: number;
        successful: number;
        failed: number;
        notifications: NotificationEvent[];
        errors: string[];
    }>;
    /**
     * Procesa reintentos de pagos fallidos
     */
    processPaymentRetries(): Promise<{
        processed: number;
        successful: number;
        failed: number;
        notifications: NotificationEvent[];
        errors: string[];
    }>;
    /**
     * Ejecuta un cobro OneClick para una suscripción
     */
    private executeOneClickCharge;
    /**
     * Ejecuta el proceso completo de facturación diaria
     */
    runDailyBilling(): Promise<{
        trialNotifications: NotificationEvent[];
        chargeResults: {
            processed: number;
            successful: number;
            failed: number;
        };
        retryResults: {
            processed: number;
            successful: number;
            failed: number;
        };
        totalNotifications: number;
        errors: string[];
        alerts: CriticalAlert[];
        alertResults: {
            sent: number;
            failed: number;
        };
    }>;
}
export declare const billingService: BillingService;
