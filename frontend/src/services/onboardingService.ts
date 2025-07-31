const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

interface OnboardingUpdateResponse {
  message: string;
  onboardingStatus: OnboardingStatus;
}

class OnboardingService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getStatus(): Promise<OnboardingStatus> {
    const response = await fetch(`${API_BASE_URL}/onboarding/status`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.onboardingStatus;
  }

  async updateStep(stepNumber: number, stepData: Record<string, any>): Promise<OnboardingStatus> {
    const response = await fetch(`${API_BASE_URL}/onboarding/update`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        stepNumber,
        stepData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data: OnboardingUpdateResponse = await response.json();
    return data.onboardingStatus;
  }

  async reset(): Promise<OnboardingStatus> {
    const response = await fetch(`${API_BASE_URL}/onboarding/reset`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.onboardingStatus;
  }
}

export const onboardingService = new OnboardingService();