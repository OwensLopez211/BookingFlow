import { subscriptionRepository, Subscription } from '../repositories/subscriptionRepository';
import { transbankService } from './transbankService';
import { alertService, CriticalAlert } from './alertService';

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

export class BillingService {
  /**
   * Procesa todos los trials que vencen en 1 día y envía notificaciones
   */
  async processTrialsEndingTomorrow(): Promise<{
    processed: number;
    notifications: NotificationEvent[];
    errors: string[];
  }> {
    console.log('=== PROCESSING TRIALS ENDING TOMORROW ===');
    
    const results = {
      processed: 0,
      notifications: [] as NotificationEvent[],
      errors: [] as string[]
    };

    try {
      // Obtener trials que vencen mañana (en 1 día)
      const expiringTrials = await subscriptionRepository.getTrialsExpiring(1);
      
      console.log(`Found ${expiringTrials.length} trials expiring tomorrow`);

      for (const subscription of expiringTrials) {
        try {
          // Crear notificación de trial terminando
          const notification: NotificationEvent = {
            type: 'trial_ending',
            subscriptionId: subscription.id,
            organizationId: subscription.organizationId,
            customerEmail: subscription.customerId, // Asumiendo que es el email
            data: {
              planName: subscription.planName,
              amount: subscription.amount,
              currency: subscription.currency,
              trialEndDate: subscription.trial_end,
              nextBillingDate: subscription.trial_end! + (24 * 60 * 60), // 24 horas después
            },
            timestamp: Math.floor(Date.now() / 1000)
          };

          results.notifications.push(notification);
          results.processed++;

          console.log(`Created trial ending notification for subscription ${subscription.id}`);
        } catch (error) {
          const errorMsg = `Error processing trial ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing trials ending tomorrow:', error);
      throw new Error(`Failed to process expiring trials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Procesa todos los trials que han vencido y ejecuta cobros OneClick
   */
  async processExpiredTrials(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    notifications: NotificationEvent[];
    errors: string[];
  }> {
    console.log('=== PROCESSING EXPIRED TRIALS ===');
    
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      notifications: [] as NotificationEvent[],
      errors: [] as string[]
    };

    try {
      // Obtener trials que vencen hoy (en 0 días)
      const expiredTrials = await subscriptionRepository.getTrialsExpiring(0);
      
      console.log(`Found ${expiredTrials.length} expired trials to charge`);

      for (const subscription of expiredTrials) {
        try {
          results.processed++;

          // Solo procesar si tiene OneClick activo
          if (!subscription.oneclick_active || !subscription.oneclick_user_id || !subscription.oneclick_username) {
            console.log(`Skipping subscription ${subscription.id} - OneClick not active`);
            continue;
          }

          // Ejecutar cobro OneClick
          const billingAttempt = await this.executeOneClickCharge(subscription);

          if (billingAttempt.success) {
            results.successful++;

            // Actualizar suscripción como exitosa
            await subscriptionRepository.updatePaymentAttempt(subscription.id, true);

            // Crear notificación de pago exitoso
            const notification: NotificationEvent = {
              type: 'payment_success',
              subscriptionId: subscription.id,
              organizationId: subscription.organizationId,
              customerEmail: subscription.customerId,
              data: {
                amount: billingAttempt.amount,
                currency: billingAttempt.currency,
                transactionId: billingAttempt.transactionId,
                planName: subscription.planName,
                nextBillingDate: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 días
              },
              timestamp: Math.floor(Date.now() / 1000)
            };

            results.notifications.push(notification);

            console.log(`Successfully charged subscription ${subscription.id}`);
          } else {
            results.failed++;

            // Actualizar suscripción como fallida
            await subscriptionRepository.updatePaymentAttempt(subscription.id, false);

            // Crear notificación de pago fallido
            const notification: NotificationEvent = {
              type: 'payment_failed',
              subscriptionId: subscription.id,
              organizationId: subscription.organizationId,
              customerEmail: subscription.customerId,
              data: {
                amount: billingAttempt.amount,
                currency: billingAttempt.currency,
                errorMessage: billingAttempt.errorMessage,
                attemptNumber: billingAttempt.attemptNumber,
                planName: subscription.planName,
              },
              timestamp: Math.floor(Date.now() / 1000)
            };

            results.notifications.push(notification);

            console.log(`Failed to charge subscription ${subscription.id}: ${billingAttempt.errorMessage}`);
          }
        } catch (error) {
          const errorMsg = `Error processing expired trial ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
          results.failed++;
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing expired trials:', error);
      throw new Error(`Failed to process expired trials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Procesa reintentos de pagos fallidos
   */
  async processPaymentRetries(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    notifications: NotificationEvent[];
    errors: string[];
  }> {
    console.log('=== PROCESSING PAYMENT RETRIES ===');
    
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      notifications: [] as NotificationEvent[],
      errors: [] as string[]
    };

    try {
      // Obtener suscripciones que necesitan reintento
      const subscriptionsForRetry = await subscriptionRepository.getSubscriptionsForRetry();
      
      console.log(`Found ${subscriptionsForRetry.length} subscriptions for payment retry`);

      for (const subscription of subscriptionsForRetry) {
        try {
          results.processed++;

          // Solo procesar si tiene OneClick activo
          if (!subscription.oneclick_active || !subscription.oneclick_user_id || !subscription.oneclick_username) {
            console.log(`Skipping subscription ${subscription.id} - OneClick not active`);
            continue;
          }

          // Ejecutar cobro OneClick
          const billingAttempt = await this.executeOneClickCharge(subscription);

          if (billingAttempt.success) {
            results.successful++;

            // Actualizar suscripción como exitosa
            await subscriptionRepository.updatePaymentAttempt(subscription.id, true);

            // Crear notificación de pago exitoso después del reintento
            const notification: NotificationEvent = {
              type: 'payment_success',
              subscriptionId: subscription.id,
              organizationId: subscription.organizationId,
              customerEmail: subscription.customerId,
              data: {
                amount: billingAttempt.amount,
                currency: billingAttempt.currency,
                transactionId: billingAttempt.transactionId,
                planName: subscription.planName,
                retryAttempt: true,
                attemptNumber: billingAttempt.attemptNumber,
              },
              timestamp: Math.floor(Date.now() / 1000)
            };

            results.notifications.push(notification);

            console.log(`Successfully charged subscription ${subscription.id} on retry attempt ${billingAttempt.attemptNumber}`);
          } else {
            results.failed++;

            // Actualizar suscripción como fallida (esto puede cancelarla si supera max intentos)
            const updatedSubscription = await subscriptionRepository.updatePaymentAttempt(subscription.id, false);

            // Crear notificación apropiada
            const notificationType = updatedSubscription.status === 'canceled' ? 'subscription_canceled' : 'payment_failed';
            
            const notification: NotificationEvent = {
              type: notificationType,
              subscriptionId: subscription.id,
              organizationId: subscription.organizationId,
              customerEmail: subscription.customerId,
              data: {
                amount: billingAttempt.amount,
                currency: billingAttempt.currency,
                errorMessage: billingAttempt.errorMessage,
                attemptNumber: billingAttempt.attemptNumber,
                planName: subscription.planName,
                finalAttempt: updatedSubscription.status === 'canceled',
              },
              timestamp: Math.floor(Date.now() / 1000)
            };

            results.notifications.push(notification);

            console.log(`Failed to charge subscription ${subscription.id} on retry attempt ${billingAttempt.attemptNumber}`);
          }
        } catch (error) {
          const errorMsg = `Error processing payment retry ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
          results.failed++;
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing payment retries:', error);
      throw new Error(`Failed to process payment retries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ejecuta un cobro OneClick para una suscripción
   */
  private async executeOneClickCharge(subscription: Subscription): Promise<BillingAttempt> {
    const attempt: BillingAttempt = {
      subscriptionId: subscription.id,
      amount: subscription.amount,
      currency: subscription.currency,
      attemptNumber: subscription.payment_attempts + 1,
      success: false,
      timestamp: Math.floor(Date.now() / 1000)
    };

    try {
      console.log(`Executing OneClick charge for subscription ${subscription.id}`);

      const buyOrder = `charge_${subscription.organizationId}_${Date.now()}`;
      
      const chargeResult = await transbankService.chargeOneclick({
        username: subscription.oneclick_username!,
        tbkUser: subscription.oneclick_user_id!,
        buyOrder,
        amount: subscription.amount,
      });

      if (chargeResult.success) {
        attempt.success = true;
        attempt.transactionId = chargeResult.authorizationCode;
        
        console.log(`OneClick charge successful for subscription ${subscription.id}`);
      } else {
        attempt.errorMessage = 'Transbank rejected the charge';
        
        console.log(`OneClick charge failed for subscription ${subscription.id}`);
      }

      return attempt;
    } catch (error) {
      attempt.errorMessage = error instanceof Error ? error.message : 'Unknown error during OneClick charge';
      
      console.error(`OneClick charge error for subscription ${subscription.id}:`, error);
      return attempt;
    }
  }

  /**
   * Ejecuta el proceso completo de facturación diaria
   */
  async runDailyBilling(): Promise<{
    trialNotifications: NotificationEvent[];
    chargeResults: { processed: number; successful: number; failed: number };
    retryResults: { processed: number; successful: number; failed: number };
    totalNotifications: number;
    errors: string[];
    alerts: CriticalAlert[];
    alertResults: { sent: number; failed: number };
  }> {
    console.log('=== RUNNING DAILY BILLING PROCESS ===');

    const errors: string[] = [];
    let trialNotifications: NotificationEvent[] = [];
    let chargeResults = { processed: 0, successful: 0, failed: 0 };
    let retryResults = { processed: 0, successful: 0, failed: 0 };

    try {
      // 1. Procesar notificaciones de trials que vencen mañana
      const trialProcess = await this.processTrialsEndingTomorrow();
      trialNotifications = trialProcess.notifications;
      errors.push(...trialProcess.errors);

      // 2. Procesar trials vencidos (cobrar)
      const expiredProcess = await this.processExpiredTrials();
      chargeResults = {
        processed: expiredProcess.processed,
        successful: expiredProcess.successful,
        failed: expiredProcess.failed
      };
      trialNotifications.push(...expiredProcess.notifications);
      errors.push(...expiredProcess.errors);

      // 3. Procesar reintentos de pagos
      const retryProcess = await this.processPaymentRetries();
      retryResults = {
        processed: retryProcess.processed,
        successful: retryProcess.successful,
        failed: retryProcess.failed
      };
      trialNotifications.push(...retryProcess.notifications);
      errors.push(...retryProcess.errors);

      const totalNotifications = trialNotifications.length;

      // 4. Analizar resultados y generar alertas críticas
      const alerts = await alertService.analyzeAndGenerateAlerts(
        chargeResults,
        retryResults,
        trialNotifications,
        errors
      );

      // 5. Detectar patrones de fraude
      const fraudAlerts = await alertService.detectFraudPatterns(trialNotifications);
      alerts.push(...fraudAlerts);

      // 6. Enviar alertas críticas
      const alertResults = await alertService.sendAlerts(alerts);

      console.log('=== DAILY BILLING COMPLETED ===');
      console.log(`Trial notifications: ${trialProcess.notifications.length}`);
      console.log(`Charges processed: ${chargeResults.processed}, successful: ${chargeResults.successful}, failed: ${chargeResults.failed}`);
      console.log(`Retries processed: ${retryResults.processed}, successful: ${retryResults.successful}, failed: ${retryResults.failed}`);
      console.log(`Total notifications: ${totalNotifications}`);
      console.log(`Errors: ${errors.length}`);
      console.log(`Alerts generated: ${alerts.length}, sent: ${alertResults.sent}, failed: ${alertResults.failed}`);

      return {
        trialNotifications,
        chargeResults,
        retryResults,
        totalNotifications,
        errors,
        alerts,
        alertResults
      };
    } catch (error) {
      console.error('Critical error in daily billing process:', error);
      throw new Error(`Daily billing process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const billingService = new BillingService();