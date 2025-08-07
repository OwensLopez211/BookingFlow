import { useState, useEffect } from 'react';
import { SubscriptionStatus } from '../../types/subscription';
import { transbankService } from '../services/transbankService';
import { useAuth } from './useAuth';

export interface OneClickStatus {
  hasOneClick: boolean;
  username?: string;
  userId?: string; // tbkUser from Transbank
  inscriptionDate?: number;
  paymentMethod?: string;
  status?: string;
  trialEnd?: number;
  nextBillingDate?: number;
  // Card details
  cardType?: string; // e.g., "AmericanExpress", "Visa", "Mastercard"
  cardNumber?: string; // Last 4 digits, e.g., "XXXXXXXXXXX2032"
  authorizationCode?: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [oneclickStatus, setOneclickStatus] = useState<OneClickStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = async () => {
    if (!user?.orgId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Usar el endpoint de suscripción
      const subscriptionData = await transbankService.getSubscriptionStatus(user.orgId);
      
      // Si es null por error 401, mostrar mensaje específico
      if (subscriptionData === null && error === null) {
        console.warn('🔧 Subscription data is null - possible auth issue');
        setError('Error de autenticación - por favor actualiza la página');
      }
      
      setSubscription(subscriptionData);

      // Obtener estado OneClick
      const oneclickData = await fetchOneclickStatus();
      setOneclickStatus(oneclickData);

    } catch (err: any) {
      console.error('Error fetching subscription status:', err);
      
      if (err.response?.status === 401) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOneclickStatus = async (): Promise<OneClickStatus | null> => {
    if (!user?.orgId) return null;

    try {
      // Usar apiClient para consistencia
      const { apiClient } = await import('../services/apiClient');
      const response = await apiClient.get(`/v1/transbank/oneclick/status/${user.orgId}`);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error fetching OneClick status:', error);
      
      if (error.response?.status === 401) {
        console.warn('🔧 Authentication error getting OneClick status');
      } else if (error.response?.status === 404) {
        console.warn('🔧 OneClick status not found - user might not have OneClick set up');
      }
      
      return null;
    }
  };

  const cancelSubscription = async () => {
    if (!user?.orgId) {
      throw new Error('Organization ID not found');
    }

    try {
      await transbankService.cancelSubscription(user.orgId);
      // Refrescar datos después de cancelar
      await fetchSubscriptionStatus();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  };

  const removeOneClickInscription = async () => {
    if (!oneclickStatus?.userId || !oneclickStatus?.username) {
      throw new Error('OneClick data not available');
    }

    try {
      await transbankService.removeOneclickInscription(
        oneclickStatus.userId,
        oneclickStatus.username
      );
      // Refrescar datos después de eliminar OneClick
      await fetchSubscriptionStatus();
    } catch (error) {
      console.error('Error removing OneClick inscription:', error);
      throw error;
    }
  };

  // Calcular días restantes del trial
  const getDaysLeftInTrial = (): number => {
    if (!subscription?.trial_end) return 0;
    
    const now = Math.floor(Date.now() / 1000);
    const daysLeft = Math.ceil((subscription.trial_end - now) / (24 * 60 * 60));
    return Math.max(0, daysLeft);
  };

  // Verificar si está en trial
  const isInTrial = (): boolean => {
    return subscription?.status === 'trialing' && getDaysLeftInTrial() > 0;
  };

  // Verificar si puede cancelar
  const canCancel = (): boolean => {
    return subscription?.status === 'trialing' || subscription?.status === 'active';
  };

  // Obtener fecha de próximo cobro
  const getNextBillingDate = (): Date | null => {
    if (subscription?.status === 'trialing' && subscription?.trial_end) {
      return new Date(subscription.trial_end * 1000);
    }
    if (oneclickStatus?.nextBillingDate) {
      return new Date(oneclickStatus.nextBillingDate * 1000);
    }
    return null;
  };

  // Obtener estado para mostrar
  const getDisplayStatus = (): {
    status: string;
    color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
    description: string;
  } => {
    if (!subscription) {
      return {
        status: 'Sin suscripción',
        color: 'gray',
        description: 'No tienes una suscripción activa'
      };
    }

    switch (subscription.status) {
      case 'trialing':
        const daysLeft = getDaysLeftInTrial();
        return {
          status: 'En período de prueba',
          color: 'blue',
          description: `${daysLeft} días restantes de prueba gratuita`
        };
      case 'active':
        return {
          status: 'Activa',
          color: 'green',
          description: 'Tu suscripción está activa y al día'
        };
      case 'past_due':
        return {
          status: 'Pago pendiente',
          color: 'yellow',
          description: 'Hay un problema con tu último pago'
        };
      case 'canceled':
        return {
          status: 'Cancelada',
          color: 'red',
          description: 'Tu suscripción ha sido cancelada'
        };
      case 'unpaid':
        return {
          status: 'Impaga',
          color: 'red',
          description: 'No se pudo procesar el pago'
        };
      default:
        return {
          status: 'Estado desconocido',
          color: 'gray',
          description: 'Estado de suscripción no reconocido'
        };
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user?.orgId]);

  return {
    subscription,
    oneclickStatus,
    isLoading,
    error,
    actions: {
      cancelSubscription,
      removeOneClickInscription,
      refresh: fetchSubscriptionStatus,
    },
    helpers: {
      getDaysLeftInTrial,
      isInTrial,
      canCancel,
      getNextBillingDate,
      getDisplayStatus,
    }
  };
};