import { useState, useEffect } from 'react';
import { onboardingService } from '@/services/onboardingService';
import { useAuthStore } from '@/stores/authStore';

interface OnboardingStatus {
  isCompleted: boolean;
  currentStep: number;
  completedSteps: OnboardingStep[];
  industry?: string;
  startedAt: string;
  completedAt?: string;
}

interface OnboardingStep {
  stepNumber: number;
  stepName: string;
  isCompleted: boolean;
  completedAt?: string;
  data?: Record<string, any>;
}

export const useOnboarding = () => {
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, initialize } = useAuthStore();

  const fetchOnboardingStatus = async () => {
    // No hacer la petición si ya sabemos que el usuario completó el onboarding
    if (user?.onboardingStatus?.isCompleted) {
      console.log('User onboarding already completed, skipping API call');
      setOnboardingStatus(user.onboardingStatus);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const status = await onboardingService.getStatus();
      setOnboardingStatus(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el estado del onboarding';
      setError(errorMessage);
      console.error('Error fetching onboarding status:', err);
      
      // Si el endpoint no existe o retorna contenido no válido, crear un estado por defecto
      if (errorMessage.includes('no disponible') || 
          errorMessage.includes('Unexpected token') || 
          errorMessage.includes('no es JSON válido') ||
          errorMessage.includes('not valid JSON')) {
        console.log('Creating default onboarding status due to missing/invalid endpoint');
        const defaultStatus = {
          isCompleted: false,
          currentStep: 1,
          completedSteps: [],
          startedAt: new Date().toISOString()
        };
        setOnboardingStatus(defaultStatus);
        setError(null); // Clear the error since we have a fallback
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateStep = async (stepNumber: number, stepData: Record<string, any>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedStatus = await onboardingService.updateStep(stepNumber, stepData);
      setOnboardingStatus(updatedStatus);
      
      // TEMPORARY FIX: Only refresh auth store if ALL 5 steps are completed
      // Ignore backend isCompleted flag until we fix the backend bug
      const actuallyCompleted = updatedStatus.completedSteps.length === 5;
      if (updatedStatus.isCompleted && actuallyCompleted) {
        console.log('🎉 Onboarding truly completed (5 steps)! Refreshing auth store...');
        await initialize();
      } else if (updatedStatus.isCompleted && !actuallyCompleted) {
        console.log('🔧 TEMPORARY FIX: Backend says completed but only ' + updatedStatus.completedSteps.length + ' steps done. Ignoring.');
      }
      
      return updatedStatus;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el paso');
      console.error('Error updating onboarding step:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetOnboarding = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const resetStatus = await onboardingService.reset();
      setOnboardingStatus(resetStatus);
      return resetStatus;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reiniciar el onboarding');
      console.error('Error resetting onboarding:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Solo cargar estado de onboarding si:
    // 1. Hay un usuario autenticado
    // 2. No tenemos ya un estado de onboarding cargado
    // 3. El usuario no ha completado el onboarding según el auth store
    if (user && !onboardingStatus && !user.onboardingStatus?.isCompleted) {
      console.log('Fetching onboarding status for user...');
      fetchOnboardingStatus();
    } else if (user?.onboardingStatus && !onboardingStatus) {
      // Usar el estado del auth store si está disponible
      console.log('Using onboarding status from auth store');
      setOnboardingStatus(user.onboardingStatus);
    } else if (!user) {
      // Limpiar estado cuando no hay usuario
      setOnboardingStatus(null);
      setError(null);
    }
  }, [user, onboardingStatus]);

  return {
    onboardingStatus,
    isLoading,
    error,
    updateStep,
    resetOnboarding,
    refetch: fetchOnboardingStatus,
  };
};