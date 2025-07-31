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
    try {
      setIsLoading(true);
      setError(null);
      const status = await onboardingService.getStatus();
      setOnboardingStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el estado del onboarding');
      console.error('Error fetching onboarding status:', err);
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
    // Only fetch onboarding status if user doesn't have completed onboarding
    if (user && !user.onboardingStatus?.isCompleted) {
      fetchOnboardingStatus();
    } else if (user?.onboardingStatus) {
      // Use the user's onboarding status from auth store if available
      setOnboardingStatus(user.onboardingStatus);
    }
  }, [user]);

  return {
    onboardingStatus,
    isLoading,
    error,
    updateStep,
    resetOnboarding,
    refetch: fetchOnboardingStatus,
  };
};