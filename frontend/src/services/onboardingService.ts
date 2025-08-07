const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/status`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // Verificar si la respuesta es HTML (error 404/500)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.warn('Onboarding endpoint returned HTML instead of JSON - endpoint may not exist');
          throw new Error(`Endpoint no disponible: ${response.status} ${response.statusText}`);
        }
        
        // Intentar parsear JSON de error
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        } catch {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }

      // Verificar que la respuesta sea JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Onboarding endpoint did not return JSON content-type');
        throw new Error('Respuesta del servidor no es JSON válido');
      }

      const data = await response.json();
      
      // Validar que tenga la estructura esperada
      if (!data || typeof data !== 'object') {
        throw new Error('Respuesta del servidor inválida');
      }
      
      // Handle different response formats from backend
      if (data.success && data.onboardingStatus) {
        return data.onboardingStatus;
      } else if (data.onboardingStatus) {
        return data.onboardingStatus;
      } else {
        return data;
      }
    } catch (error) {
      // Si es un error de parsing JSON, mostrar mensaje más claro
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        console.error('Server returned HTML instead of JSON - this usually means the endpoint does not exist');
        throw new Error('El servicio de onboarding no está disponible. Contacta con el administrador.');
      }
      
      // Re-lanzar otros errores
      throw error;
    }
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