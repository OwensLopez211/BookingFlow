"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withOptionalAuth = exports.withAuth = exports.requireOwnerPermissions = exports.requireAdminPermissions = exports.requireOrganization = exports.requireRole = exports.requireAuth = exports.authenticateUser = exports.extractTokenFromHeader = void 0;
const authService_1 = require("../services/authService");
const response_1 = require("../utils/response");
/**
 * Extract and validate JWT token from Authorization header
 */
const extractTokenFromHeader = (authHeader) => {
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
exports.extractTokenFromHeader = extractTokenFromHeader;
/**
 * Authenticate user using access token
 */
const authenticateUser = async (accessToken) => {
    try {
        const result = await (0, authService_1.getCurrentUserService)(accessToken);
        if (!result.success || !result.user) {
            throw new Error('Token inv�lido o usuario no encontrado');
        }
        return result.user;
    }
    catch (error) {
        console.error('Authentication error:', error);
        // Map specific errors
        if (error.message.includes('Token')) {
            throw new Error('Token inv�lido o expirado');
        }
        if (error.message.includes('Usuario no encontrado')) {
            throw new Error('Usuario no encontrado en el sistema');
        }
        throw new Error('Error de autenticaci�n');
    }
};
exports.authenticateUser = authenticateUser;
/**
 * Middleware function to authenticate requests
 * Returns the authenticated user or throws an error
 */
const requireAuth = async (event) => {
    try {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        const accessToken = (0, exports.extractTokenFromHeader)(authHeader);
        const user = await (0, exports.authenticateUser)(accessToken);
        console.log('User authenticated successfully:', user.email);
        return user;
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        throw error;
    }
};
exports.requireAuth = requireAuth;
/**
 * Check if user has required role
 */
const requireRole = (user, requiredRoles) => {
    return requiredRoles.includes(user.role);
};
exports.requireRole = requireRole;
/**
 * Check if user belongs to specific organization
 */
const requireOrganization = (user, orgId) => {
    return user.orgId === orgId;
};
exports.requireOrganization = requireOrganization;
/**
 * Check if user has admin permissions (owner or admin)
 */
const requireAdminPermissions = (user) => {
    return user.role === 'owner' || user.role === 'admin';
};
exports.requireAdminPermissions = requireAdminPermissions;
/**
 * Check if user is organization owner
 */
const requireOwnerPermissions = (user) => {
    return user.role === 'owner';
};
exports.requireOwnerPermissions = requireOwnerPermissions;
/**
 * Middleware wrapper that adds authentication to a handler
 */
const withAuth = (handler, options) => {
    return async (event) => {
        try {
            // Authenticate user
            const user = await (0, exports.requireAuth)(event);
            // Check role permissions if specified
            if (options?.requiredRoles && !(0, exports.requireRole)(user, options.requiredRoles)) {
                return (0, response_1.unauthorizedResponse)(`Permisos insuficientes. Roles requeridos: ${options.requiredRoles.join(', ')}`);
            }
            // Check organization membership if specified
            if (options?.requireOrganization && !user.orgId) {
                return (0, response_1.unauthorizedResponse)('Usuario debe pertenecer a una organizaci�n');
            }
            // Add user to event and call handler
            const authenticatedEvent = {
                ...event,
                user,
            };
            return await handler(authenticatedEvent);
        }
        catch (error) {
            console.error('Auth middleware error:', error);
            return (0, response_1.unauthorizedResponse)(error.message || 'Error de autenticaci�n');
        }
    };
};
exports.withAuth = withAuth;
/**
 * Optional auth middleware - adds user to event if token is present, but doesn't require it
 */
const withOptionalAuth = (handler) => {
    return async (event) => {
        try {
            const authHeader = event.headers.Authorization || event.headers.authorization;
            if (authHeader) {
                try {
                    const accessToken = (0, exports.extractTokenFromHeader)(authHeader);
                    const user = await (0, exports.authenticateUser)(accessToken);
                    // Add user to event
                    const eventWithUser = { ...event, user };
                    return await handler(eventWithUser);
                }
                catch (error) {
                    // If auth fails with optional auth, continue without user
                    console.log('Optional auth failed, continuing without user:', error);
                }
            }
            // Call handler without user
            return await handler(event);
        }
        catch (error) {
            console.error('Optional auth middleware error:', error);
            return await handler(event);
        }
    };
};
exports.withOptionalAuth = withOptionalAuth;
