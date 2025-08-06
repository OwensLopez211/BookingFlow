import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, LoginRequest, RegisterRequest } from '@/services/authService';
import { showToast } from '@/components/ui';

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

interface User {
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
  onboardingStatus?: OnboardingStatus;
}

interface Organization {
  id: string;
  name: string;
  templateType: 'beauty_salon' | 'hyperbaric_center' | 'medical_clinic' | 'fitness_center' | 'consultant' | 'custom';
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  subscription: {
    plan: 'free' | 'basic' | 'premium';
    limits: {
      maxResources: number;
      maxAppointmentsPerMonth: number;
      maxUsers: number;
    };
    trial?: {
      isActive: boolean;
      startDate: string;
      endDate: string;
      daysTotal: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest): Promise<boolean> => {
        console.log('🔐 AuthStore: Iniciando login para:', credentials.email);
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login(credentials);
          console.log('📨 AuthStore: Respuesta del servicio de login:', response);
          
          if (response.success && response.user) {
            const user = response.user as User;
            set({
              user,
              organization: response.organization || null,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            // Welcome toast with user's name
            const firstName = user.profile?.firstName || 'Usuario';
            const timeOfDay = new Date().getHours() < 12 ? 'Buenos días' : 
                             new Date().getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';
            
            showToast.success(
              `¡${timeOfDay}, ${firstName}!`,
              'Bienvenido de vuelta a BookFlow. ¡Listo para gestionar tus citas!'
            );
            
            // TODO: Agregar notificación de login cuando el sistema esté estable
            return true;
          } else {
            console.log('❌ AuthStore: Login falló:', response.error);
            set({
              isLoading: false,
              error: response.error || 'Error durante el login',
            });
            
            showToast.error(
              'Error de autenticación',
              response.error || 'Credenciales incorrectas. Por favor intenta de nuevo.'
            );
            return false;
          }
        } catch (error: any) {
          console.log('🚨 AuthStore: Excepción durante login:', error);
          const errorMessage = error.message || 'Error durante el login';
          set({
            isLoading: false,
            error: errorMessage,
          });
          
          showToast.error(
            'Error de conexión',
            'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          );
          return false;
        }
      },

      register: async (data: RegisterRequest): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.register(data);
          
          if (response.success && response.user) {
            const user = response.user as User;
            set({
              user,
              organization: response.organization || null,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            const firstName = user.profile?.firstName || 'Usuario';
            showToast.success(
              `¡Bienvenido a BookFlow, ${firstName}!`,
              'Tu cuenta ha sido creada exitosamente. ¡Comienza a gestionar tus citas ahora!'
            );
            
            // TODO: Agregar notificación de registro cuando el sistema esté estable
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Error durante el registro',
            });
            
            showToast.error(
              'Error en el registro',
              response.error || 'No se pudo crear la cuenta. Por favor intenta de nuevo.'
            );
            return false;
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Error durante el registro';
          set({
            isLoading: false,
            error: errorMessage,
          });
          
          showToast.error(
            'Error de conexión',
            'No se pudo conectar con el servidor durante el registro.'
          );
          return false;
        }
      },

      logout: () => {
        const currentUser = get().user;
        const firstName = currentUser?.profile?.firstName || 'Usuario';
        
        authService.logout();
        set({ user: null, organization: null, isAuthenticated: false });
        
        showToast.info(
          `¡Hasta luego, ${firstName}!`,
          'Tu sesión ha sido cerrada de forma segura. ¡Vuelve pronto!'
        );
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      initialize: async () => {
        console.log('🔄 Initializing auth store...');
        set({ isLoading: true });
        
        const isAuth = authService.isAuthenticated();
        if (isAuth) {
          try {
            // Try to get fresh user data from API
            console.log('🌐 Fetching current user from API...');
            const currentUserResponse = await authService.getCurrentUser();
            
            if (currentUserResponse.success && currentUserResponse.user) {
              console.log('✅ Current user fetched successfully:', currentUserResponse.user);
              
              set({
                user: currentUserResponse.user as User,
                organization: currentUserResponse.organization || null,
                isAuthenticated: true,
                isLoading: false,
              });

              // Update localStorage with fresh data
              if (currentUserResponse.user && currentUserResponse.organization) {
                localStorage.setItem('userData', JSON.stringify({
                  user: currentUserResponse.user,
                  organization: currentUserResponse.organization
                }));
              }

              // If no organization in response but user has orgId, fetch it
              if (!currentUserResponse.organization && currentUserResponse.user.orgId) {
                console.log('🏢 Fetching organization with orgId:', currentUserResponse.user.orgId);
                try {
                  const organizationData = await authService.getOrganizationById(currentUserResponse.user.orgId);
                  if (organizationData && organizationData.organization) {
                    set((state) => ({
                      ...state,
                      organization: organizationData.organization,
                    }));
                    
                    // Update localStorage
                    localStorage.setItem('userData', JSON.stringify({
                      user: currentUserResponse.user,
                      organization: organizationData.organization
                    }));
                  }
                } catch (error) {
                  console.error('❌ Error fetching organization:', error);
                }
              }
            } else {
              // API call failed, fallback to stored data
              console.log('⚠️ API call failed, using stored data...');
              const userInfo = authService.getUserInfo();
              
              if (userInfo) {
                set({
                  user: userInfo.user,
                  organization: userInfo.organization,
                  isAuthenticated: true,
                  isLoading: false,
                });
              } else {
                throw new Error('No user info available');
              }
            }
          } catch (error) {
            console.error('❌ Error during initialization:', error);
            
            // Fallback to local storage data
            const userInfo = authService.getUserInfo();
            if (userInfo) {
              console.log('🔄 Using cached user data...');
              set({
                user: userInfo.user,
                organization: userInfo.organization,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              // No valid data, logout
              console.log('🚫 No valid user data, logging out...');
              authService.logout();
              set({
                user: null,
                organization: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          }
        } else {
          console.log('🚫 User not authenticated');
          set({
            user: null,
            organization: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
