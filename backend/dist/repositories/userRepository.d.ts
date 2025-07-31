export interface User {
    id: string;
    cognitoId: string;
    email: string;
    role: 'owner' | 'admin' | 'staff';
    orgId?: string;
    profile: {
        firstName: string;
        lastName: string;
        phone?: string;
        avatar?: string;
    };
    createdAt: string;
    updatedAt: string;
}
export declare const createUser: (userData: Omit<User, "id" | "createdAt" | "updatedAt">) => Promise<User>;
export declare const getUserById: (userId: string) => Promise<User | null>;
export declare const getUserByCognitoId: (cognitoId: string) => Promise<User | null>;
