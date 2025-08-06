import { NotificationEvent } from './billingService';
export interface CriticalAlert {
    type: 'billing_failure' | 'payment_fraud' | 'system_error' | 'high_failure_rate';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    data: Record<string, any>;
    timestamp: number;
    organizationId?: string;
    subscriptionId?: string;
}
export interface AlertThresholds {
    maxFailureRate: number;
    maxConsecutiveFailures: number;
    criticalErrorPatterns: string[];
}
export declare class AlertService {
    private readonly thresholds;
    /**
     * Analiza los resultados de facturación y genera alertas críticas
     */
    analyzeAndGenerateAlerts(chargeResults: {
        processed: number;
        successful: number;
        failed: number;
    }, retryResults: {
        processed: number;
        successful: number;
        failed: number;
    }, notifications: NotificationEvent[], errors: string[]): Promise<CriticalAlert[]>;
    /**
     * Envía una alerta crítica específica
     */
    sendCriticalAlert(alert: CriticalAlert): Promise<void>;
    /**
     * Envía múltiples alertas
     */
    sendAlerts(alerts: CriticalAlert[]): Promise<{
        sent: number;
        failed: number;
        errors: string[];
    }>;
    /**
     * Verifica si una organización tiene demasiados fallos consecutivos
     */
    checkConsecutiveFailures(organizationId: string): Promise<CriticalAlert | null>;
    /**
     * Detecta patrones de fraude en fallos de pago
     */
    detectFraudPatterns(notifications: NotificationEvent[]): Promise<CriticalAlert[]>;
}
export declare const alertService: AlertService;
