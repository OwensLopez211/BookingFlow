import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';

export interface TrialStatus {
  isInTrial: boolean;
  daysRemaining: number;
  totalTrialDays: number;
  trialEndDate: Date | null;
  trialStartDate: Date | null;
  subscriptionStatus: 'trialing' | 'active' | 'expired' | 'no-trial' | null;
}

export const useTrialStatus = () => {
  const { organization } = useAuthStore();
  
  const trialStatus: TrialStatus = useMemo(() => {
    // Si no hay organización, no hay trial
    if (!organization?.subscription?.trial) {
      return {
        isInTrial: false,
        daysRemaining: 0,
        totalTrialDays: 0,
        trialEndDate: null,
        trialStartDate: null,
        subscriptionStatus: 'no-trial',
      };
    }

    const trial = organization.subscription.trial;
    const now = new Date();
    const trialEnd = new Date(trial.endDate);
    const trialStart = new Date(trial.startDate);
    
    // Calcular días restantes
    const diffTime = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    // Determinar si está en trial activo
    const isInTrial = trial.isActive && daysRemaining > 0;
    
    // Determinar estado de la suscripción
    let subscriptionStatus: TrialStatus['subscriptionStatus'];
    if (!trial.isActive) {
      subscriptionStatus = 'no-trial';
    } else if (daysRemaining > 0) {
      subscriptionStatus = 'trialing';
    } else {
      subscriptionStatus = 'expired';
    }

    return {
      isInTrial,
      daysRemaining,
      totalTrialDays: trial.daysTotal,
      trialEndDate: trialEnd,
      trialStartDate: trialStart,
      subscriptionStatus,
    };
  }, [organization?.subscription?.trial]);

  // Estado para forzar re-render cada hora
  const [, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    // Actualizar cada hora para mantener el contador fresco
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 60 * 60 * 1000); // Cada hora

    return () => clearInterval(interval);
  }, []);

  return {
    trialStatus,
    isLoading: false, // Ya no necesitamos loading ya que los datos vienen del store
    error: null, // No hay errores de red ya que usamos datos locales
    refetch: () => {}, // No necesitamos refetch ya que los datos vienen del store
  };
};