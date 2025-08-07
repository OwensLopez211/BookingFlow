import { ApiResponse } from '../../types/common';
import { Organization, UpdateOrganizationSettingsRequest } from '../../types/organization';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

class OrganizationService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getMyOrganization(): Promise<any> {
    try {
      const url = `${API_BASE_URL}/v1/organizations/me`;
      console.log('🌐 OrganizationService: Haciendo fetch a:', url);
      console.log('🔑 OrganizationService: Headers:', this.getHeaders());

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      console.log('📡 OrganizationService: Response status:', response.status);
      console.log('📡 OrganizationService: Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('❌ OrganizationService: Response is not JSON, content-type:', contentType);
        const text = await response.text();
        console.log('📄 OrganizationService: Response text:', text.substring(0, 200));
        throw new Error(`El servidor no devolvió JSON válido. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 OrganizationService: Response data:', data);
      
      if (!response.ok) {
        console.log('❌ OrganizationService: Response not OK');
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ OrganizationService: Devolviendo data:', data);
      return data;
    } catch (error: any) {
      console.error('❌ OrganizationService: Error capturado:', error);
      const errorResponse = {
        success: false,
        error: error?.message || 'Error de conexión',
      };
      console.log('❌ OrganizationService: Devolviendo error:', errorResponse);
      return errorResponse;
    }
  }

  async updateOrganizationSettings(
    orgId: string, 
    settings: UpdateOrganizationSettingsRequest
  ): Promise<any> {
    try {
      const url = `${API_BASE_URL}/v1/organizations/${orgId}/settings`;
      console.log('🔄 OrganizationService: Enviando PUT a:', url);
      console.log('📦 OrganizationService: Settings a enviar:', JSON.stringify(settings, null, 2));
      console.log('🔑 OrganizationService: Headers:', this.getHeaders());

      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(settings),
      });

      console.log('📡 OrganizationService: Response status:', response.status);
      console.log('📡 OrganizationService: Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('❌ OrganizationService: Response is not JSON, content-type:', contentType);
        const text = await response.text();
        console.log('📄 OrganizationService: Response text:', text.substring(0, 200));
        throw new Error(`El servidor no devolvió JSON válido. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 OrganizationService: Response data:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.log('❌ OrganizationService: Response not OK');
        throw new Error(data.error || 'Error actualizando la configuración');
      }

      console.log('✅ OrganizationService: Actualizacion exitosa, devolviendo data');
      return data;
    } catch (error: any) {
      console.error('❌ OrganizationService: Error capturado:', error);
      const errorResponse = {
        success: false,
        error: error.message || 'Error de conexión',
      };
      console.log('❌ OrganizationService: Devolviendo error:', errorResponse);
      return errorResponse;
    }
  }

  async getBusinessConfiguration(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/business-config/me`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.log('Response text:', text.substring(0, 200));
        throw new Error(`El servidor no devolvió JSON válido. Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error obteniendo configuración del negocio');
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error de conexión',
      };
    }
  }

  async getOnboardingData(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/onboarding/status`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.log('Response text:', text.substring(0, 200));
        throw new Error(`El servidor no devolvió JSON válido. Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error obteniendo datos del onboarding');
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error de conexión',
      };
    }
  }
}

export const organizationService = new OrganizationService();