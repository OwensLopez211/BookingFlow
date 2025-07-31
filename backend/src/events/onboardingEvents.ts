import { EventEmitter } from 'events';

export interface OnboardingStepCompletedEvent {
  userId: string;
  orgId: string;
  stepNumber: number;
  stepData: any;
  timestamp: string;
}

export interface OnboardingCompletedEvent {
  userId: string;
  orgId: string;
  onboardingData: {
    completedSteps: Array<{
      stepNumber: number;
      data: any;
    }>;
  };
  timestamp: string;
}

class OnboardingEventEmitter extends EventEmitter {
  // Event types
  static readonly STEP_COMPLETED = 'onboarding:step:completed';
  static readonly ONBOARDING_COMPLETED = 'onboarding:completed';

  emitStepCompleted(event: OnboardingStepCompletedEvent) {
    this.emit(OnboardingEventEmitter.STEP_COMPLETED, event);
  }

  emitOnboardingCompleted(event: OnboardingCompletedEvent) {
    this.emit(OnboardingEventEmitter.ONBOARDING_COMPLETED, event);
  }
}

export const onboardingEventEmitter = new OnboardingEventEmitter();