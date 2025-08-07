import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Configure axios defaults
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  templateType: 'beauty_salon' | 'hyperbaric_center';
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: 'owner' | 'admin' | 'staff';
    orgId?: string;
    profile: {
      firstName: string;
      lastName: string;
      phone?: string;
      avatar?: string;
    };
  };
  organization?: {
    id: string;
    name: string;
    templateType: 'beauty_salon' | 'hyperbaric_center';
  };
  tokens?: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
  message?: string;
  error?: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🚀 AuthService: Enviando solicitud de login a:', `${API_BASE_URL}/v1/auth/login`);
      console.log('📤 AuthService: Datos de login:', { email: data.email, password: '[HIDDEN]' });
      
      const response = await apiClient.post('/v1/auth/login', data);
      console.log('📥 AuthService: Respuesta del servidor:', response.status, response.statusText);
      
      if (response.data.success && response.data.tokens) {
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('idToken', response.data.tokens.idToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        
        // Store user data for easy access
        if (response.data.user && response.data.organization) {
          localStorage.setItem('userData', JSON.stringify({
            user: response.data.user,
            organization: response.data.organization
          }));
        }
      }
      
      console.log('✅ AuthService: Datos de respuesta:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService: Error de login:', error);
      console.error('❌ AuthService: Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error during login',
      };
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('🚀 Sending register request:', data);
      console.log('🌐 API URL:', API_BASE_URL);
      
      const response = await apiClient.post('/v1/auth/register', data);
      
      console.log('✅ Register response:', response.data);
      
      if (response.data.success && response.data.tokens) {
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('idToken', response.data.tokens.idToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        
        // Store user data for easy access
        if (response.data.user && response.data.organization) {
          localStorage.setItem('userData', JSON.stringify({
            user: response.data.user,
            organization: response.data.organization
          }));
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Register error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      return {
        success: false,
        error: error.response?.data?.error || 'Error during registration',
      };
    }
  },

  async refreshTokens(): Promise<{ accessToken: string; idToken: string } | null> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.warn('🔧 No refresh token available');
        return null;
      }

      console.log('🔄 AuthService: Refreshing tokens...');
      const response = await apiClient.post('/v1/auth/refresh', {
        refreshToken
      });

      if (response.data.success && response.data.tokens) {
        console.log('✅ AuthService: Tokens refreshed successfully');
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('idToken', response.data.tokens.idToken);
        if (response.data.tokens.refreshToken) {
          localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        }
        return {
          accessToken: response.data.tokens.accessToken,
          idToken: response.data.tokens.idToken
        };
      }

      return null;
    } catch (error: any) {
      console.error('❌ AuthService: Error refreshing tokens:', error);
      console.warn('🔧 AuthService: Refresh token failed, but keeping localStorage intact for now');
      // Don't automatically logout - let the user manually re-authenticate
      // Only clear tokens if it's a specific auth error (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('🔧 AuthService: Auth error during refresh - clearing tokens');
        this.logout();
      }
      return null;
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  async getOrganizationById(orgId: string): Promise<any> {
    try {
      console.log('🌐 Fetching organization with ID:', orgId);
      const response = await apiClient.get(`/v1/organizations/${orgId}`);
      console.log('📥 Organization API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching organization:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      return null;
    }
  },

  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const response = await apiClient.get('/v1/auth/me');
      return response.data;
    } catch (error: any) {
      console.error('Error getting current user:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error getting user info',
      };
    }
  },

  getUserInfo(): { user: any; organization: any } | null {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Try to get stored user data from login/register response
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        return JSON.parse(storedUserData);
      }

      // Fallback to token info if available
      return {
        user: {
          id: payload.sub || payload.userId,
          email: payload.email,
          role: payload.role || 'owner',
          orgId: payload.orgId || payload['custom:orgId'],
          profile: {
            firstName: payload.firstName || payload['custom:firstName'] || 'Usuario',
            lastName: payload.lastName || payload['custom:lastName'] || '',
            phone: payload.phone || payload['custom:phone'],
            avatar: payload.avatar || payload['custom:avatar'],
          }
        },
        organization: null // Will be fetched separately
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  },
};
