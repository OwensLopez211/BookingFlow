export interface User {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'staff';
  orgId?: string;
  cognitoId: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
  onboardingStatus?: OnboardingStatus;
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
  stepName: 'industry_selection' | 'organization_setup' | 'business_configuration' | 'plan_selection';
  isCompleted: boolean;
  completedAt?: string;
  data?: Record<string, any>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

export interface OnboardingUpdateRequest {
  stepNumber: number;
  stepData: Record<string, any>;
}

export interface IndustrySelection {
  industryType: 'beauty_salon' | 'medical_clinic' | 'hyperbaric_center' | 'fitness_center' | 'consultant' | 'custom';
  customIndustryName?: string;
}

export interface OrganizationSetupData {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  timezone: string;
  currency: string;
}

export interface BusinessConfigurationData {
  appointmentModel: 'professional_based' | 'resource_based' | 'hybrid';
  allowClientSelection: boolean;
  bufferBetweenAppointments: number;
  maxAdvanceBookingDays: number;
}
