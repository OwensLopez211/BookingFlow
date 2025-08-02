export interface User {
    id: string;
    email: string;
    name: string;
    role: 'owner' | 'admin' | 'staff';
    orgId?: string;
    cognitoId: string;
    profile: {
      firstName: string;
      lastName: string;
      phone?: string;
      avatar?: string;
    };
  }
  
  export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    templateType: 'beauty_salon' | 'hyperbaric_center';
  }