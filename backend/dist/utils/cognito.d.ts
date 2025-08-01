export interface CreateUserParams {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    orgId?: string;
    role?: string;
}
export interface LoginParams {
    email: string;
    password: string;
}
export declare const createCognitoUser: (params: CreateUserParams) => Promise<{
    success: boolean;
    cognitoId: string | undefined;
    email: string;
}>;
export declare const loginUser: (params: LoginParams) => Promise<{
    success: boolean;
    tokens: {
        accessToken: string | undefined;
        idToken: string | undefined;
        refreshToken: string | undefined;
    };
    expiresIn: number | undefined;
}>;
export declare const forgotPassword: (email: string) => Promise<{
    success: boolean;
    message: string;
}>;
export declare const resetPassword: (email: string, confirmationCode: string, newPassword: string) => Promise<{
    success: boolean;
    message: string;
}>;
export declare const getCognitoUser: (accessToken: string) => Promise<{
    success: boolean;
    user: {
        username: string | undefined;
        email: string;
        firstName: string;
        lastName: string;
        orgId: string;
        role: string;
        emailVerified: boolean;
        cognitoId: string | undefined;
    };
}>;
export declare const updateUserAttributes: (username: string, attributes: Record<string, string>) => Promise<{
    success: boolean;
}>;
