export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    templateType: 'beauty_salon' | 'hyperbaric_center';
}
export interface LoginData {
    email: string;
    password: string;
}
export declare const registerUserAndOrganization: (data: RegisterData) => Promise<{
    success: boolean;
    user: {
        id: string;
        email: string;
        role: "owner" | "admin" | "staff";
        orgId: string | undefined;
        profile: {
            firstName: string;
            lastName: string;
            phone?: string;
            avatar?: string;
        };
    };
    organization: {
        id: string;
        name: string;
        templateType: "beauty_salon" | "hyperbaric_center" | "medical_clinic" | "fitness_center" | "consultant" | "custom";
    };
    tokens: {
        accessToken: string | undefined;
        idToken: string | undefined;
        refreshToken: string | undefined;
    };
    message: string;
}>;
export declare const loginUserService: (data: LoginData) => Promise<{
    success: boolean;
    tokens: {
        accessToken: string | undefined;
        idToken: string | undefined;
        refreshToken: string | undefined;
    };
    user: {
        id: string;
        email: string;
        role: "owner" | "admin" | "staff";
        orgId: string | undefined;
        profile: {
            firstName: string;
            lastName: string;
            phone?: string;
            avatar?: string;
        };
        cognitoId: string;
    };
    expiresIn: number | undefined;
    message: string;
}>;
export declare const getCurrentUserService: (accessToken: string) => Promise<{
    success: boolean;
    user: {
        id: string;
        email: string;
        role: "owner" | "admin" | "staff";
        orgId: string | undefined;
        profile: {
            firstName: string;
            lastName: string;
            phone?: string;
            avatar?: string;
        };
        cognitoId: string;
    };
}>;
export interface GoogleAuthData {
    googleToken: string;
    organizationName?: string;
    templateType?: 'beauty_salon' | 'hyperbaric_center';
}
export declare const googleAuthService: (data: GoogleAuthData) => Promise<{
    success: boolean;
    tokens: {
        accessToken: string;
        idToken: string;
        refreshToken: string;
    };
    user: {
        id: string;
        email: string;
        role: "owner" | "admin" | "staff";
        orgId: string | undefined;
        profile: {
            firstName: string;
            lastName: string;
            phone?: string;
            avatar?: string;
        };
        cognitoId: string;
    };
    organization: import("../repositories/organizationRepository").Organization | undefined;
    expiresIn: number;
    message: string;
}>;
