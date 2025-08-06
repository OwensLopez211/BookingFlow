import { apiClient } from './apiClient';
import { 
  OneClickInscriptionData, 
  OneClickInscriptionResponse,
  OneClickFinishInscriptionData,
  OneClickFinishInscriptionResponse,
  OneClickChargeData,
  OneClickChargeResponse,
  SubscriptionStatus
} from '../../types/subscription';

export interface SubscriptionPlan {
  planId: string;
  planName: string;
  planPrice: string;
  planPeriod?: string;
  transbankAmount?: number;
  trialDays?: number;
  requiresPayment: boolean;
  // OneClick fields
  enableOneClick?: boolean;
  oneclickData?: OneClickInscriptionData;
}

export interface TransbankTransaction {
  orderId: string;
  token: string;
  url: string;
  amount: number;
}

// SubscriptionStatus now imported from types

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
      const response = await apiClient.get(`/v1/transbank/subscription/${organizationId}`);
      return response.data.data || response.data; // Handle both formats
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
      const response = await apiClient.post('/v1/transbank/cancel-subscription', {
        organizationId
      });
      return response.data.data || response.data; // Handle both formats
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
      
      const response = await apiClient.post('/v1/transbank/start-free-trial', {
        planId: plan.planId,
        organizationId,
        trialDays: plan.trialDays || 30, // 1 mes por defecto
      });
      return response.data.data || response.data; // Handle both formats
    } catch (error) {
      console.error('Error starting free trial:', error);
      throw new Error('No se pudo iniciar el mes gratuito.');
    }
  }

  /**
   * ONECLICK: Inicia una inscripción OneClick para pagos recurrentes
   */
  async startOneclickInscription(data: OneClickInscriptionData): Promise<OneClickInscriptionResponse> {
    try {
      console.log('Starting OneClick inscription:', data);
      
      const response = await apiClient.post('/v1/transbank/oneclick/start-inscription', data);
      return response.data.data; // Backend returns {success, message, data}
    } catch (error) {
      console.error('Error starting OneClick inscription:', error);
      throw new Error('No se pudo iniciar la inscripción OneClick.');
    }
  }

  /**
   * ONECLICK: Finaliza una inscripción OneClick
   */
  async finishOneclickInscription(data: OneClickFinishInscriptionData): Promise<OneClickFinishInscriptionResponse> {
    try {
      console.log('Finishing OneClick inscription:', data);
      
      const response = await apiClient.post('/v1/transbank/oneclick/finish-inscription', data);
      return response.data.data; // Backend returns {success, message, data}
    } catch (error) {
      console.error('Error finishing OneClick inscription:', error);
      throw new Error('No se pudo completar la inscripción OneClick.');
    }
  }

  /**
   * ONECLICK: Elimina una inscripción OneClick existente
   */
  async removeOneclickInscription(tbkUser: string, username: string): Promise<{ success: boolean }> {
    try {
      console.log('Removing OneClick inscription:', { tbkUser, username });
      
      const response = await apiClient.post('/v1/transbank/oneclick/remove-inscription', {
        tbkUser,
        username
      });
      return response.data.data || response.data; // Handle both formats
    } catch (error) {
      console.error('Error removing OneClick inscription:', error);
      throw new Error('No se pudo eliminar la inscripción OneClick.');
    }
  }

  /**
   * ONECLICK: Ejecuta un cobro usando OneClick
   */
  async chargeOneclick(data: OneClickChargeData): Promise<OneClickChargeResponse> {
    try {
      console.log('Charging OneClick:', data);
      
      const response = await apiClient.post('/v1/transbank/oneclick/charge', data);
      return response.data.data || response.data; // Handle both formats
    } catch (error) {
      console.error('Error charging OneClick:', error);
      throw new Error('No se pudo procesar el cobro OneClick.');
    }
  }

  /**
   * ONECLICK: Inicia trial con OneClick configurado para cobro automático
   */
  async startTrialWithOneclick(
    plan: SubscriptionPlan, 
    organizationId: string, 
    oneclickData: OneClickInscriptionData
  ): Promise<{ success: boolean; inscriptionToken?: string; tbkUser?: string }> {
    try {
      console.log('Starting trial with OneClick setup:', { plan, organizationId, oneclickData });
      
      // 1. Primero iniciar la inscripción OneClick
      const inscription = await this.startOneclickInscription(oneclickData);
      
      // 2. Iniciar el trial con la información de OneClick
      const response = await apiClient.post('/v1/transbank/start-trial-with-oneclick', {
        planId: plan.planId,
        organizationId,
        trialDays: plan.trialDays || 30,
        oneclickToken: inscription.token,
        oneclickUsername: oneclickData.username,
      });
      
      return {
        success: true,
        inscriptionToken: inscription.token,
        tbkUser: inscription.tbkUser,
        ...response.data
      };
    } catch (error) {
      console.error('Error starting trial with OneClick:', error);
      throw new Error('No se pudo iniciar el trial con OneClick.');
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
   * Redirige al usuario a Transbank Webpay usando POST con TBK_TOKEN
   */
  redirectToTransbankWebpay(urlWebpay: string, token: string): void {
    console.log('🔗 Redirecting to Transbank Webpay via POST:', { urlWebpay, token });
    
    // Crear un formulario hidden para hacer POST redirect
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = urlWebpay;
    form.style.display = 'none';
    
    // Crear el input hidden con el token
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'TBK_TOKEN';
    tokenInput.value = token;
    
    form.appendChild(tokenInput);
    document.body.appendChild(form);
    
    // Submit el formulario automáticamente
    form.submit();
  }

  /**
   * DESHABILITADO: Manejo de retorno de Webpay (para futura implementación)
   */
  async handleWebpayReturn(token: string): Promise<{ success: boolean; details?: any }> {
    throw new Error('Los pagos están temporalmente deshabilitados.');
  }
}

export const transbankService = new TransbankService();