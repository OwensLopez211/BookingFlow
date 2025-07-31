import { APIGatewayProxyEvent } from 'aws-lambda';
export interface AuthenticatedUser {
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
}
export interface AuthenticatedEvent extends APIGatewayProxyEvent {
    user: AuthenticatedUser;
}
/**
 * Extract and validate JWT token from Authorization header
 */
export declare const extractTokenFromHeader: (authHeader?: string) => string;
/**
 * Authenticate user using access token
 */
export declare const authenticateUser: (accessToken: string) => Promise<AuthenticatedUser>;
/**
 * Middleware function to authenticate requests
 * Returns the authenticated user or throws an error
 */
export declare const requireAuth: (event: APIGatewayProxyEvent) => Promise<AuthenticatedUser>;
/**
 * Check if user has required role
 */
export declare const requireRole: (user: AuthenticatedUser, requiredRoles: ("owner" | "admin" | "staff")[]) => boolean;
/**
 * Check if user belongs to specific organization
 */
export declare const requireOrganization: (user: AuthenticatedUser, orgId: string) => boolean;
/**
 * Check if user has admin permissions (owner or admin)
 */
export declare const requireAdminPermissions: (user: AuthenticatedUser) => boolean;
/**
 * Check if user is organization owner
 */
export declare const requireOwnerPermissions: (user: AuthenticatedUser) => boolean;
/**
 * Middleware wrapper that adds authentication to a handler
 */
export declare const withAuth: (handler: (event: AuthenticatedEvent) => Promise<any>, options?: {
    requiredRoles?: ("owner" | "admin" | "staff")[];
    requireOrganization?: boolean;
}) => (event: APIGatewayProxyEvent) => Promise<any>;
/**
 * Optional auth middleware - adds user to event if token is present, but doesn't require it
 */
export declare const withOptionalAuth: (handler: (event: APIGatewayProxyEvent & {
    user?: AuthenticatedUser;
}) => Promise<any>) => (event: APIGatewayProxyEvent) => Promise<any>;
