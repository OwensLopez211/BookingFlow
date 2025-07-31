import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/layout/OnboardingLayout';
import { IndustrySelectionStep } from './steps/IndustrySelectionStep';
import { OrganizationSetupStep } from './steps/OrganizationSetupStep';
import { BusinessConfigurationStep } from './steps/BusinessConfigurationStep';
import { ServicesSetupStep } from './steps/ServicesSetupStep';
import { PlanSelectionStep } from './steps/PlanSelectionStep';
import { useOnboarding } from '@/hooks/useOnboarding';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { onboardingStatus, updateStep, isLoading, resetOnboarding } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(1);
  const [localOnboardingCompleted, setLocalOnboardingCompleted] = useState(false);

  useEffect(() => {
    if (onboardingStatus) {
      // Only redirect to dashboard if locally marked as completed
      if (localOnboardingCompleted) {
        navigate('/dashboard');
        return;
      }
      
      // TEMPORARY FIX: Ignore backend currentStep and isCompleted
      // Force step progression based on actual completed steps count
      const actualCompletedSteps = onboardingStatus.completedSteps.length;
      const correctStep = Math.min(actualCompletedSteps + 1, 5);
      
      console.log(`🔧 TEMPORARY FIX: Backend says step ${onboardingStatus.currentStep}, but using step ${correctStep} based on ${actualCompletedSteps} completed steps`);
      
      setCurrentStep(correctStep);
    }
  }, [onboardingStatus, navigate, localOnboardingCompleted]);

  const handleReset = async () => {
    if (confirm('¿Estás seguro de que quieres reiniciar el onboarding? Esto borrará todo el progreso.')) {
      try {
        await resetOnboarding();
        setCurrentStep(1);
        setLocalOnboardingCompleted(false);
      } catch (error) {
        console.error('Error resetting onboarding:', error);
      }
    }
  };

  const handleStepComplete = async (stepData: any) => {
    try {
      console.log(`=== FRONTEND ONBOARDING DEBUG ===`);
      console.log(`Current step: ${currentStep}`);
      console.log(`Step data:`, JSON.stringify(stepData, null, 2));
      console.log(`Sending to backend:`, {
        stepNumber: currentStep,
        stepData: stepData
      });
      
      const updatedStatus = await updateStep(currentStep, stepData);
      
      console.log(`Updated status:`, updatedStatus);
      console.log(`Backend isCompleted: ${updatedStatus.isCompleted}`);
      console.log(`Backend currentStep: ${updatedStatus.currentStep}`);
      console.log(`Completed steps: ${updatedStatus.completedSteps.length}`);
      
      // TEMPORARY FIX: Calculate next step based on completed steps, not backend logic
      const actualCompletedSteps = updatedStatus.completedSteps.length;
      const nextStep = Math.min(actualCompletedSteps + 1, 5);
      
      if (nextStep <= 5 && actualCompletedSteps < 5) {
        console.log(`🔧 TEMPORARY FIX: Moving to step ${nextStep} based on ${actualCompletedSteps} completed steps (ignoring backend isCompleted: ${updatedStatus.isCompleted})`);
        setCurrentStep(nextStep);
      } else {
        // All 5 steps completed - mark onboarding as completed locally
        console.log('🎉 All 5 steps completed! Redirecting to dashboard...');
        setLocalOnboardingCompleted(true);
      }
    } catch (error) {
      console.error('❌ Error updating onboarding step:', error);
      console.error('❌ Error details:', {
        step: currentStep,
        data: stepData,
        error: error instanceof Error ? error.message : error
      });
      
      // Show user-friendly error
      alert(`Error en el paso ${currentStep}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <IndustrySelectionStep
            onComplete={handleStepComplete}
            isLoading={isLoading}
            initialData={onboardingStatus?.completedSteps.find(s => s.stepNumber === 1)?.data}
          />
        );
      case 2:
        return (
          <OrganizationSetupStep
            onComplete={handleStepComplete}
            isLoading={isLoading}
            initialData={onboardingStatus?.completedSteps.find(s => s.stepNumber === 2)?.data}
          />
        );
      case 3:
        return (
          <BusinessConfigurationStep
            onComplete={handleStepComplete}
            isLoading={isLoading}
            initialData={onboardingStatus?.completedSteps.find(s => s.stepNumber === 3)?.data}
          />
        );
      case 4:
        const industryData = onboardingStatus?.completedSteps.find(s => s.stepNumber === 1)?.data;
        return (
          <ServicesSetupStep
            onComplete={handleStepComplete}
            isLoading={isLoading}
            initialData={onboardingStatus?.completedSteps.find(s => s.stepNumber === 4)?.data}
            industryType={industryData?.industryType || 'custom'}
          />
        );
      case 5:
        return (
          <PlanSelectionStep
            onComplete={handleStepComplete}
            isLoading={isLoading}
            initialData={onboardingStatus?.completedSteps.find(s => s.stepNumber === 5)?.data}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Selecciona tu industria';
      case 2:
        return 'Configura tu organización';
      case 3:
        return 'Personaliza tu configuración';
      case 4:
        return 'Configura tus servicios';
      case 5:
        return 'Elige tu plan de servicio';
      default:
        return '';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return 'Elige el tipo de negocio que mejor describa tu empresa para personalizar tu experiencia.';
      case 2:
        return 'Proporciona la información básica de tu empresa y horarios de atención.';
      case 3:
        return 'Configura las preferencias de tu sistema de citas para optimizar tu flujo de trabajo.';
      case 4:
        return 'Selecciona y personaliza los servicios que ofrece tu negocio.';
      case 5:
        return 'Selecciona el plan que mejor se adapte a las necesidades de tu negocio.';
      default:
        return '';
    }
  };

  if (!onboardingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }


  return (
    <>
      {/* Debug overlay - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 bg-red-900 text-white p-3 rounded-lg shadow-lg text-xs max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">🐛 Debug</h3>
            <button 
              onClick={handleReset}
              className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs"
              title="Reset Onboarding"
            >
              🔄
            </button>
          </div>
          <div className="space-y-1">
            <div>Backend: completed={String(onboardingStatus.isCompleted)}, step={onboardingStatus.currentStep}</div>
            <div>Frontend: step={currentStep}, local={String(localOnboardingCompleted)}</div>
            <div>Steps completed: {onboardingStatus.completedSteps.length}/5</div>
          </div>
          <div className="mt-2 flex space-x-1">
            <button 
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
              title="Previous Step"
            >
              ⬅️
            </button>
            <button 
              onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
              className="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded text-xs"
              title="Next Step"
            >
              ➡️
            </button>
          </div>
        </div>
      )}

      <OnboardingLayout
        currentStep={currentStep}
        totalSteps={5}
        title={getStepTitle()}
        subtitle={getStepSubtitle()}
        onPreviousStep={handlePreviousStep}
        canGoBack={currentStep > 1}
        showBackInFooter={currentStep >= 3}
      >
        {getStepContent()}
      </OnboardingLayout>
    </>
  );
};