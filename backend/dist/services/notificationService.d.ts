import { NotificationEvent } from './billingService';
export interface EmailTemplate {
    subject: string;
    htmlContent: string;
    textContent: string;
}
export interface EmailRecipient {
    email: string;
    name?: string;
    organizationId?: string;
}
export interface EmailSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
export declare class NotificationService {
    /**
     * Envía notificaciones de eventos de facturación por email
     */
    sendBillingNotifications(notifications: NotificationEvent[]): Promise<{
        sent: number;
        failed: number;
        errors: string[];
    }>;
    /**
     * Obtiene la plantilla de email para eventos de facturación
     */
    private getBillingEmailTemplate;
    /**
     * Plantilla para trial que está por vencer
     */
    private getTrialEndingTemplate;
    /**
     * Plantilla para pago exitoso
     */
    private getPaymentSuccessTemplate;
    /**
     * Plantilla para fallo de pago
     */
    private getPaymentFailedTemplate;
    /**
     * Plantilla para suscripción cancelada
     */
    private getSubscriptionCanceledTemplate;
    /**
     * Envía un email usando el proveedor configurado
     */
    private sendEmail;
    /**
     * Envía una notificación de prueba
     */
    sendTestNotification(email: string): Promise<EmailSendResult>;
}
export declare const notificationService: NotificationService;
