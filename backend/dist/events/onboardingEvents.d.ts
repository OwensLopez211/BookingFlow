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
declare class OnboardingEventEmitter extends EventEmitter {
    static readonly STEP_COMPLETED = "onboarding:step:completed";
    static readonly ONBOARDING_COMPLETED = "onboarding:completed";
    emitStepCompleted(event: OnboardingStepCompletedEvent): void;
    emitOnboardingCompleted(event: OnboardingCompletedEvent): void;
}
export declare const onboardingEventEmitter: OnboardingEventEmitter;
export {};
