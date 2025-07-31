import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export interface BookFlowAPIGatewayProxyEvent extends APIGatewayProxyEvent {
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
        cognitoId: string;
    };
}
export interface StandardAPIResponse {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
    timestamp: string;
}
export interface PaginatedResponse<T> extends StandardAPIResponse {
    data: {
        items: T[];
        total: number;
        page: number;
        pageSize: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
export interface ErrorResponse extends StandardAPIResponse {
    success: false;
    error: string;
    validationErrors?: ValidationError[];
}
export type LambdaHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export type AuthenticatedLambdaHandler = (event: BookFlowAPIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    templateType: 'beauty_salon' | 'hyperbaric_center';
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface ForgotPasswordRequest {
    email: string;
}
export interface ResetPasswordRequest {
    email: string;
    confirmationCode: string;
    newPassword: string;
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        role: string;
        orgId?: string;
        profile: {
            firstName: string;
            lastName: string;
        };
    };
    organization?: {
        id: string;
        name: string;
        templateType: string;
    };
    tokens: {
        accessToken: string;
        idToken: string;
        refreshToken: string;
    };
    expiresIn?: number;
}
export interface CreateOrganizationRequest {
    name: string;
    templateType: 'beauty_salon' | 'hyperbaric_center';
}
export interface UpdateOrganizationRequest {
    name?: string;
    settings?: {
        timezone?: string;
        businessHours?: Record<string, {
            isOpen: boolean;
            openTime: string;
            closeTime: string;
        }>;
        notifications?: {
            emailReminders?: boolean;
            smsReminders?: boolean;
            autoConfirmation?: boolean;
            reminderHours?: number;
        };
    };
}
export interface OrganizationResponse {
    id: string;
    name: string;
    templateType: 'beauty_salon' | 'hyperbaric_center';
    settings: {
        timezone: string;
        businessHours: Record<string, {
            isOpen: boolean;
            openTime: string;
            closeTime: string;
        }>;
        notifications: {
            emailReminders: boolean;
            smsReminders: boolean;
            autoConfirmation: boolean;
            reminderHours: number;
        };
    };
    subscription: {
        plan: 'free' | 'premium';
        limits: {
            maxResources: number;
            maxAppointmentsPerMonth: number;
            maxUsers: number;
        };
    };
    createdAt: string;
    updatedAt: string;
}
export interface PaginationParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface FilterParams {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    [key: string]: string | undefined;
}
export declare enum HttpStatusCode {
    OK = 200,
    CREATED = 201,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503
}
export declare enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
}
export declare const RolePermissions: {
    readonly owner: readonly ["read", "write", "delete", "admin", "billing"];
    readonly admin: readonly ["read", "write", "delete", "admin"];
    readonly staff: readonly ["read", "write"];
};
export type Permission = 'read' | 'write' | 'delete' | 'admin' | 'billing';
export type Role = keyof typeof RolePermissions;
