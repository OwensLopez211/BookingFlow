export interface User {
    id: string;
    cognitoId: string;
    email: string;
    role: 'owner' | 'admin' | 'staff';
    orgId?: string;
    profile: {
        firstName: string;
        lastName: string;
        phone?: string;
        avatar?: string;
    };
    onboardingStatus?: OnboardingStatus;
    createdAt: string;
    updatedAt: string;
}
export interface OnboardingStatus {
    isCompleted: boolean;
    currentStep: number;
    completedSteps: OnboardingStep[];
    industry?: string;
    startedAt: string;
    completedAt?: string;
}
export interface OnboardingStep {
    stepNumber: number;
    stepName: 'industry_selection' | 'organization_setup' | 'business_configuration' | 'services_setup' | 'plan_selection';
    isCompleted: boolean;
    completedAt?: string;
    data?: Record<string, any>;
}
export declare const createUser: (userData: Omit<User, "id" | "createdAt" | "updatedAt">) => Promise<User>;
export declare const getUserById: (userId: string) => Promise<User | null>;
export declare const getUserByCognitoId: (cognitoId: string) => Promise<User | null>;
export declare const getUserByEmail: (email: string) => Promise<User | null>;
export declare const updateUserOnboarding: (userId: string, stepNumber: number, stepData: Record<string, any>) => Promise<User | null>;
