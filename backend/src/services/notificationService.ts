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

export class NotificationService {
  /**
   * Envía notificaciones de eventos de facturación por email
   */
  async sendBillingNotifications(notifications: NotificationEvent[]): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    console.log(`=== SENDING ${notifications.length} BILLING NOTIFICATIONS ===`);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const notification of notifications) {
      try {
        const template = this.getBillingEmailTemplate(notification);
        const recipient: EmailRecipient = {
          email: notification.customerEmail,
          organizationId: notification.organizationId
        };

        const result = await this.sendEmail(recipient, template);
        
        if (result.success) {
          results.sent++;
          console.log(`✅ Notification sent: ${notification.type} to ${recipient.email}`);
        } else {
          results.failed++;
          results.errors.push(`Failed to send ${notification.type} to ${recipient.email}: ${result.error}`);
          console.error(`❌ Failed to send ${notification.type} to ${recipient.email}: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        const errorMsg = `Error processing notification ${notification.type}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log(`Notifications sent: ${results.sent}, failed: ${results.failed}`);
    return results;
  }

  /**
   * Obtiene la plantilla de email para eventos de facturación
   */
  private getBillingEmailTemplate(notification: NotificationEvent): EmailTemplate {
    switch (notification.type) {
      case 'trial_ending':
        return this.getTrialEndingTemplate(notification);
      case 'payment_success':
        return this.getPaymentSuccessTemplate(notification);
      case 'payment_failed':
        return this.getPaymentFailedTemplate(notification);
      case 'subscription_canceled':
        return this.getSubscriptionCanceledTemplate(notification);
      default:
        throw new Error(`Unknown notification type: ${notification.type}`);
    }
  }

  /**
   * Plantilla para trial que está por vencer
   */
  private getTrialEndingTemplate(notification: NotificationEvent): EmailTemplate {
    const { planName, amount, currency, trialEndDate, nextBillingDate } = notification.data;
    const trialEndFormatted = new Date(trialEndDate * 1000).toLocaleDateString('es-CL');
    const nextBillingFormatted = new Date(nextBillingDate * 1000).toLocaleDateString('es-CL');

    return {
      subject: `Tu período de prueba gratuito termina mañana - BookFlow`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; font-size: 24px; margin: 0;">BookFlow</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Sistema de Gestión de Citas</p>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h2 style="color: #92400e; font-size: 18px; margin: 0 0 10px 0;">⏰ Tu período de prueba termina mañana</h2>
              <p style="color: #92400e; margin: 0; line-height: 1.5;">
                Tu período de prueba gratuito del <strong>${planName}</strong> termina el <strong>${trialEndFormatted}</strong>.
              </p>
            </div>

            <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">¿Qué pasa después?</h3>
            <ul style="color: #4b5563; line-height: 1.6; padding-left: 20px;">
              <li>El <strong>${nextBillingFormatted}</strong> se cobrará automáticamente <strong>$${amount.toLocaleString('es-CL')} ${currency}</strong></li>
              <li>Tu servicio continuará sin interrupciones</li>
              <li>Puedes cancelar en cualquier momento desde tu panel de control</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/settings?tab=subscription" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Gestionar Suscripción
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Si tienes preguntas, contacta nuestro soporte en support@bookflow.cl
              </p>
            </div>
          </div>
        </div>
      `,
      textContent: `
BookFlow - Tu período de prueba termina mañana

Tu período de prueba gratuito del ${planName} termina el ${trialEndFormatted}.

El ${nextBillingFormatted} se cobrará automáticamente $${amount.toLocaleString('es-CL')} ${currency}.

Puedes gestionar tu suscripción en: ${process.env.FRONTEND_URL}/settings?tab=subscription

Si tienes preguntas, contacta nuestro soporte en support@bookflow.cl
      `
    };
  }

  /**
   * Plantilla para pago exitoso
   */
  private getPaymentSuccessTemplate(notification: NotificationEvent): EmailTemplate {
    const { amount, currency, transactionId, planName, nextBillingDate, retryAttempt } = notification.data;
    const nextBillingFormatted = nextBillingDate 
      ? new Date(nextBillingDate * 1000).toLocaleDateString('es-CL')
      : null;

    const isRetry = retryAttempt === true;

    return {
      subject: `✅ Pago procesado exitosamente - BookFlow`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; font-size: 24px; margin: 0;">BookFlow</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Sistema de Gestión de Citas</p>
            </div>
            
            <div style="background-color: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h2 style="color: #065f46; font-size: 18px; margin: 0 0 10px 0;">✅ Pago procesado exitosamente</h2>
              <p style="color: #065f46; margin: 0; line-height: 1.5;">
                ${isRetry ? 'Tu pago pendiente ha sido procesado correctamente.' : 'Tu pago mensual ha sido procesado correctamente.'}
              </p>
            </div>

            <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">Detalles del pago</h3>
            <ul style="color: #4b5563; line-height: 1.6; padding-left: 20px;">
              <li><strong>Plan:</strong> ${planName}</li>
              <li><strong>Monto:</strong> $${amount.toLocaleString('es-CL')} ${currency}</li>
              <li><strong>ID de transacción:</strong> ${transactionId}</li>
              ${nextBillingFormatted ? `<li><strong>Próximo cobro:</strong> ${nextBillingFormatted}</li>` : ''}
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/settings?tab=subscription" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Ver Detalles de Suscripción
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Gracias por usar BookFlow. Si tienes preguntas, contacta support@bookflow.cl
              </p>
            </div>
          </div>
        </div>
      `,
      textContent: `
BookFlow - Pago procesado exitosamente

${isRetry ? 'Tu pago pendiente ha sido procesado correctamente.' : 'Tu pago mensual ha sido procesado correctamente.'}

Detalles del pago:
- Plan: ${planName}
- Monto: $${amount.toLocaleString('es-CL')} ${currency}
- ID de transacción: ${transactionId}
${nextBillingFormatted ? `- Próximo cobro: ${nextBillingFormatted}` : ''}

Ver detalles: ${process.env.FRONTEND_URL}/settings?tab=subscription

Gracias por usar BookFlow.
      `
    };
  }

  /**
   * Plantilla para fallo de pago
   */
  private getPaymentFailedTemplate(notification: NotificationEvent): EmailTemplate {
    const { amount, currency, errorMessage, attemptNumber, planName, finalAttempt } = notification.data;

    return {
      subject: `❌ Problema con tu pago - BookFlow`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; font-size: 24px; margin: 0;">BookFlow</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Sistema de Gestión de Citas</p>
            </div>
            
            <div style="background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h2 style="color: #dc2626; font-size: 18px; margin: 0 0 10px 0;">❌ Problema con tu pago</h2>
              <p style="color: #dc2626; margin: 0; line-height: 1.5;">
                ${finalAttempt 
                  ? 'No pudimos procesar tu pago después de varios intentos. Tu suscripción ha sido cancelada.'
                  : `No pudimos procesar tu pago (intento ${attemptNumber}/3). Intentaremos nuevamente en unos días.`
                }
              </p>
            </div>

            <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">Detalles del intento de pago</h3>
            <ul style="color: #4b5563; line-height: 1.6; padding-left: 20px;">
              <li><strong>Plan:</strong> ${planName}</li>
              <li><strong>Monto:</strong> $${amount.toLocaleString('es-CL')} ${currency}</li>
              <li><strong>Intento:</strong> ${attemptNumber}/3</li>
              ${errorMessage ? `<li><strong>Motivo:</strong> ${errorMessage}</li>` : ''}
            </ul>

            <h3 style="color: #1f2937; font-size: 16px; margin: 30px 0 15px 0;">¿Qué puedes hacer?</h3>
            <ul style="color: #4b5563; line-height: 1.6; padding-left: 20px;">
              <li>Verifica que tu tarjeta tenga fondos suficientes</li>
              <li>Confirma que los datos de tu tarjeta sean correctos</li>
              <li>Contacta a tu banco si el problema persiste</li>
              ${finalAttempt ? '<li>Configura un nuevo método de pago para reactivar tu suscripción</li>' : ''}
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/settings?tab=subscription" 
                 style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                ${finalAttempt ? 'Configurar Método de Pago' : 'Revisar Suscripción'}
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Si necesitas ayuda, contacta nuestro soporte en support@bookflow.cl
              </p>
            </div>
          </div>
        </div>
      `,
      textContent: `
BookFlow - Problema con tu pago

${finalAttempt 
  ? 'No pudimos procesar tu pago después de varios intentos. Tu suscripción ha sido cancelada.'
  : `No pudimos procesar tu pago (intento ${attemptNumber}/3). Intentaremos nuevamente en unos días.`
}

Detalles:
- Plan: ${planName}
- Monto: $${amount.toLocaleString('es-CL')} ${currency}
- Intento: ${attemptNumber}/3

${finalAttempt ? 'Configura un nuevo método de pago en:' : 'Revisa tu suscripción en:'} ${process.env.FRONTEND_URL}/settings?tab=subscription

Si necesitas ayuda, contacta support@bookflow.cl
      `
    };
  }

  /**
   * Plantilla para suscripción cancelada
   */
  private getSubscriptionCanceledTemplate(notification: NotificationEvent): EmailTemplate {
    const { planName, amount, currency } = notification.data;

    return {
      subject: `Tu suscripción ha sido cancelada - BookFlow`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; font-size: 24px; margin: 0;">BookFlow</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Sistema de Gestión de Citas</p>
            </div>
            
            <div style="background-color: #f3f4f6; border: 1px solid #6b7280; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h2 style="color: #374151; font-size: 18px; margin: 0 0 10px 0;">Tu suscripción ha sido cancelada</h2>
              <p style="color: #374151; margin: 0; line-height: 1.5;">
                Tu suscripción al <strong>${planName}</strong> ha sido cancelada debido a problemas con el pago.
              </p>
            </div>

            <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">¿Qué significa esto?</h3>
            <ul style="color: #4b5563; line-height: 1.6; padding-left: 20px;">
              <li>Tu acceso a las funciones premium se ha suspendido</li>
              <li>No se realizarán más intentos de cobro</li>
              <li>Puedes reactivar tu suscripción en cualquier momento</li>
              <li>Tus datos están seguros y no se eliminarán</li>
            </ul>

            <h3 style="color: #1f2937; font-size: 16px; margin: 30px 0 15px 0;">¿Quieres reactivar tu suscripción?</h3>
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              Puedes configurar un nuevo método de pago y reactivar tu suscripción inmediatamente.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/settings?tab=subscription" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reactivar Suscripción
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                Lamentamos cualquier inconveniente. Si tienes preguntas, contacta support@bookflow.cl
              </p>
            </div>
          </div>
        </div>
      `,
      textContent: `
BookFlow - Tu suscripción ha sido cancelada

Tu suscripción al ${planName} ha sido cancelada debido a problemas con el pago.

Qué significa esto:
- Tu acceso a las funciones premium se ha suspendido
- No se realizarán más intentos de cobro
- Puedes reactivar tu suscripción en cualquier momento
- Tus datos están seguros y no se eliminarán

Para reactivar tu suscripción: ${process.env.FRONTEND_URL}/settings?tab=subscription

Si tienes preguntas, contacta support@bookflow.cl
      `
    };
  }

  /**
   * Envía un email usando el proveedor configurado
   */
  private async sendEmail(recipient: EmailRecipient, template: EmailTemplate): Promise<EmailSendResult> {
    try {
      console.log(`📧 Sending email to ${recipient.email}: ${template.subject}`);

      // TODO: Implementar envío real de emails
      // Opciones populares:
      // - AWS SES
      // - SendGrid
      // - Mailgun
      // - Resend
      // - Nodemailer con SMTP

      // Por ahora, simulamos el envío exitoso
      const mockResult: EmailSendResult = {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Simular tiempo de envío
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log(`✅ Email sent successfully to ${recipient.email} (Mock)`);
      return mockResult;

    } catch (error) {
      console.error(`❌ Failed to send email to ${recipient.email}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Envía una notificación de prueba
   */
  async sendTestNotification(email: string): Promise<EmailSendResult> {
    const template: EmailTemplate = {
      subject: 'Prueba de notificaciones - BookFlow',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>¡Prueba exitosa!</h1>
          <p>Si recibes este email, las notificaciones están funcionando correctamente.</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
        </div>
      `,
      textContent: `
Prueba exitosa!

Si recibes este email, las notificaciones están funcionando correctamente.

Fecha: ${new Date().toLocaleString('es-CL')}
      `
    };

    const recipient: EmailRecipient = { email };
    return this.sendEmail(recipient, template);
  }
}

export const notificationService = new NotificationService();