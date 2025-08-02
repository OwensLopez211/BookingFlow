import { apiClient } from './apiClient';

export interface SubscriptionPlan {
  planId: string;
  planName: string;
  planPrice: string;
  planPeriod?: string;
  transbankAmount?: number;
  trialDays?: number;
  requiresPayment: boolean;
}

export interface TransbankTransaction {
  orderId: string;
  token: string;
  url: string;
  amount: number;
}

export interface SubscriptionStatus {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  current_period_end: number;
  trial_end?: number;
  plan: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    interval: string;
  };
}

class TransbankService {
  /**
   * DESHABILITADO: Crear transacción de pago (para futura implementación)
   */
  async createTransaction(plan: SubscriptionPlan, organizationId: string, returnUrl: string): Promise<TransbankTransaction> {
    throw new Error('Los pagos están temporalmente deshabilitados. Solo se permite el registro con trial gratuito.');
  }

  /**
   * DESHABILITADO: Confirmar transacción (para futura implementación)
   */
  async confirmTransaction(token: string): Promise<{ success: boolean; transactionDetails?: any }> {
    throw new Error('Los pagos están temporalmente deshabilitados.');
  }

  /**
   * DESHABILITADO: Verificar pago (para futura implementación)
   */
  async verifyPayment(token: string): Promise<{ success: boolean; amount?: number; orderId?: string }> {
    throw new Error('Los pagos están temporalmente deshabilitados.');
  }

  /**
   * Obtiene el estado actual de la suscripción
   */
  async getSubscriptionStatus(organizationId: string): Promise<SubscriptionStatus | null> {
    try {
      const response = await apiClient.get(`/transbank/subscription/${organizationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return null;
    }
  }

  /**
   * Cancela una suscripción
   */
  async cancelSubscription(organizationId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post('/transbank/cancel-subscription', {
        organizationId
      });
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('No se pudo cancelar la suscripción. Por favor, contacta soporte.');
    }
  }

  /**
   * Inicia el mes gratuito sin requerir método de pago
   */
  async startFreeTrial(plan: SubscriptionPlan, organizationId: string): Promise<{ success: boolean }> {
    try {
      console.log('Starting free trial for plan:', plan);
      
      const response = await apiClient.post('/transbank/start-free-trial', {
        planId: plan.planId,
        organizationId,
        trialDays: plan.trialDays || 30, // 1 mes por defecto
      });
      return response.data;
    } catch (error) {
      console.error('Error starting free trial:', error);
      throw new Error('No se pudo iniciar el mes gratuito.');
    }
  }

  /**
   * DESHABILITADO: Facturación mensual (para futura implementación)
   */
  async generateMonthlyBilling(organizationId: string, amount: number, returnUrl: string): Promise<TransbankTransaction> {
    throw new Error('La facturación automática está temporalmente deshabilitada.');
  }

  /**
   * DESHABILITADO: Confirmación de pago (para futura implementación)
   */
  async processPaymentConfirmation(token: string, orderId: string): Promise<{ success: boolean; subscription?: SubscriptionStatus }> {
    throw new Error('Los pagos están temporalmente deshabilitados.');
  }

  /**
   * DESHABILITADO: Redirección a Webpay (para futura implementación)
   */
  redirectToWebpay(transaction: TransbankTransaction): void {
    throw new Error('Los pagos están temporalmente deshabilitados.');
  }

  /**
   * DESHABILITADO: Manejo de retorno de Webpay (para futura implementación)
   */
  async handleWebpayReturn(token: string): Promise<{ success: boolean; details?: any }> {
    throw new Error('Los pagos están temporalmente deshabilitados.');
  }
}

export const transbankService = new TransbankService();