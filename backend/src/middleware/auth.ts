import { APIGatewayProxyEvent } from 'aws-lambda';
import { getCurrentUserService } from '../services/authService';
import { unauthorizedResponse } from '../utils/response';

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
export const extractTokenFromHeader = (authHeader?: string): string => {
  if (!authHeader) {
    throw new Error('Authorization header requerido');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Token debe usar formato Bearer');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (!token || token.trim() === '') {
    throw new Error('Token de acceso requerido');
  }

  return token;
};

/**
 * Authenticate user using access token
 */
export const authenticateUser = async (accessToken: string): Promise<AuthenticatedUser> => {
  try {
    const result = await getCurrentUserService(accessToken);
    
    if (!result.success || !result.user) {
      throw new Error('Token inválido o usuario no encontrado');
    }

    return result.user as AuthenticatedUser;
  } catch (error: any) {
    console.error('Authentication error:', error);
    
    // Map specific errors
    if (error.message.includes('Token')) {
      throw new Error('Token inválido o expirado');
    }
    
    if (error.message.includes('Usuario no encontrado')) {
      throw new Error('Usuario no encontrado en el sistema');
    }
    
    throw new Error('Error de autenticación');
  }
};

/**
 * Middleware function to authenticate requests
 * Returns the authenticated user or throws an error
 */
export const requireAuth = async (event: APIGatewayProxyEvent): Promise<AuthenticatedUser> => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const accessToken = extractTokenFromHeader(authHeader);
    const user = await authenticateUser(accessToken);
    
    console.log('User authenticated successfully:', user.email);
    return user;
  } catch (error: any) {
    console.error('Authentication middleware error:', error);
    throw error;
  }
};

/**
 * Check if user has required role
 */
export const requireRole = (user: AuthenticatedUser, requiredRoles: ('owner' | 'admin' | 'staff')[]): boolean => {
  return requiredRoles.includes(user.role);
};

/**
 * Check if user belongs to specific organization
 */
export const requireOrganization = (user: AuthenticatedUser, orgId: string): boolean => {
  return user.orgId === orgId;
};

/**
 * Check if user has admin permissions (owner or admin)
 */
export const requireAdminPermissions = (user: AuthenticatedUser): boolean => {
  return user.role === 'owner' || user.role === 'admin';
};

/**
 * Check if user is organization owner
 */
export const requireOwnerPermissions = (user: AuthenticatedUser): boolean => {
  return user.role === 'owner';
};

/**
 * Middleware wrapper that adds authentication to a handler
 */
export const withAuth = (
  handler: (event: AuthenticatedEvent) => Promise<any>,
  options?: {
    requiredRoles?: ('owner' | 'admin' | 'staff')[];
    requireOrganization?: boolean;
  }
) => {
  return async (event: APIGatewayProxyEvent) => {
    try {
      // Authenticate user
      const user = await requireAuth(event);
      
      // Check role permissions if specified
      if (options?.requiredRoles && !requireRole(user, options.requiredRoles)) {
        return unauthorizedResponse(`Permisos insuficientes. Roles requeridos: ${options.requiredRoles.join(', ')}`);
      }
      
      // Check organization membership if specified
      if (options?.requireOrganization && !user.orgId) {
        return unauthorizedResponse('Usuario debe pertenecer a una organización');
      }
      
      // Add user to event and call handler
      const authenticatedEvent: AuthenticatedEvent = {
        ...event,
        user,
      };
      
      return await handler(authenticatedEvent);
    } catch (error: any) {
      console.error('Auth middleware error:', error);
      return unauthorizedResponse(error.message || 'Error de autenticación');
    }
  };
};

/**
 * Optional auth middleware - adds user to event if token is present, but doesn't require it
 */
export const withOptionalAuth = (
  handler: (event: APIGatewayProxyEvent & { user?: AuthenticatedUser }) => Promise<any>
) => {
  return async (event: APIGatewayProxyEvent) => {
    try {
      const authHeader = event.headers.Authorization || event.headers.authorization;
      
      if (authHeader) {
        try {
          const accessToken = extractTokenFromHeader(authHeader);
          const user = await authenticateUser(accessToken);
          
          // Add user to event
          const eventWithUser = { ...event, user };
          return await handler(eventWithUser);
        } catch (error) {
          // If auth fails with optional auth, continue without user
          console.log('Optional auth failed, continuing without user:', error);
        }
      }
      
      // Call handler without user
      return await handler(event);
    } catch (error: any) {
      console.error('Optional auth middleware error:', error);
      return await handler(event);
    }
  };
};