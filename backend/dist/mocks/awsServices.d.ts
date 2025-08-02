export declare const mockCognito: {
    adminCreateUser: (params: any) => Promise<{
        User: {
            Username: string;
            Attributes: any;
            UserStatus: string;
        };
    }>;
    adminSetUserPassword: (params: any) => Promise<{
        success: boolean;
    }>;
    initiateAuth: (params: any) => Promise<{
        AuthenticationResult: {
            AccessToken: string;
            IdToken: string;
            RefreshToken: string;
            ExpiresIn: number;
        };
    }>;
    getUser: (params: any) => Promise<{
        Username: any;
        UserAttributes: {
            Name: string;
            Value: any;
        }[];
    }>;
};
export declare const mockDynamoDB: {
    put: (params: any) => Promise<{
        success: boolean;
    }>;
    get: (params: any) => Promise<{
        Item: any;
    }>;
    query: (params: any) => Promise<{
        Items: any[];
    }>;
    scan: (params: any) => Promise<{
        Items: any[];
    }>;
};
export declare const initializeDefaultData: () => void;
