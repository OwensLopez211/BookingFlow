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
    organizationName: string;
    templateType: 'beauty_salon' | 'hyperbaric_center';
}
export interface ForgotPasswordRequest {
    email: string;
}
export interface ResetPasswordRequest {
    email: string;
    confirmationCode: string;
    newPassword: string;
}
