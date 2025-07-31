"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const organizationService_1 = require("../services/organizationService");
const authService_1 = require("../services/authService");
const response_1 = require("../utils/response");
const extractUserFromToken = async (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Token de acceso requerido');
    }
    const accessToken = authHeader.substring(7);
    const result = await (0, authService_1.getCurrentUserService)(accessToken);
    if (!result.success || !result.user) {
        throw new Error('Token inválido o usuario no encontrado');
    }
    return result.user;
};
const handler = async (event) => {
    console.log('=== ORGANIZATIONS HANDLER ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    try {
        const { httpMethod, path, body, headers, pathParameters } = event;
        // Handle CORS preflight
        if (httpMethod === 'OPTIONS') {
            return (0, response_1.createResponse)(200);
        }
        // Parse request body if present
        let requestData = {};
        if (body) {
            try {
                requestData = JSON.parse(body);
            }
            catch (error) {
                console.error('Error parsing request body:', error);
                return (0, response_1.errorResponse)('Invalid JSON in request body', 400);
            }
        }
        // GET ORGANIZATION TEMPLATES (Public endpoint)
        if (path?.endsWith('/organizations/templates') && httpMethod === 'GET') {
            console.log('=== GET TEMPLATES REQUEST ===');
            const result = await (0, organizationService_1.getOrganizationTemplatesService)();
            console.log('Templates retrieved successfully');
            return (0, response_1.successResponse)(result, 'Templates obtenidos exitosamente');
        }
        // Extract user from token for protected endpoints
        const authHeader = headers.Authorization || headers.authorization;
        let currentUser;
        try {
            currentUser = await extractUserFromToken(authHeader);
        }
        catch (error) {
            return (0, response_1.unauthorizedResponse)(error.message);
        }
        // CREATE ORGANIZATION
        if (path?.endsWith('/organizations') && httpMethod === 'POST') {
            console.log('=== CREATE ORGANIZATION REQUEST ===');
            const { name, templateType } = requestData;
            if (!name || !templateType) {
                return (0, response_1.errorResponse)('Nombre y tipo de template son requeridos', 400);
            }
            const result = await (0, organizationService_1.createOrganizationService)({
                name,
                templateType,
                ownerId: currentUser.id,
            });
            console.log('Organization created successfully:', result.organization.id);
            return (0, response_1.successResponse)(result, 'Organización creada exitosamente');
        }
        // GET ORGANIZATION BY ID
        if (path?.match(/\/organizations\/[^/]+$/) && httpMethod === 'GET') {
            console.log('=== GET ORGANIZATION REQUEST ===');
            const orgId = pathParameters?.orgId;
            if (!orgId) {
                return (0, response_1.errorResponse)('ID de organización requerido', 400);
            }
            const result = await (0, organizationService_1.getOrganizationService)(orgId, currentUser.id);
            console.log('Organization retrieved successfully:', orgId);
            return (0, response_1.successResponse)(result, 'Organización obtenida exitosamente');
        }
        // UPDATE ORGANIZATION
        if (path?.match(/\/organizations\/[^/]+$/) && httpMethod === 'PUT') {
            console.log('=== UPDATE ORGANIZATION REQUEST ===');
            const orgId = pathParameters?.orgId;
            if (!orgId) {
                return (0, response_1.errorResponse)('ID de organización requerido', 400);
            }
            const result = await (0, organizationService_1.updateOrganizationService)(orgId, currentUser.id, requestData);
            console.log('Organization updated successfully:', orgId);
            return (0, response_1.successResponse)(result, 'Organización actualizada exitosamente');
        }
        // GET USER'S ORGANIZATION (Default org for user)
        if (path?.endsWith('/organizations/me') && httpMethod === 'GET') {
            console.log('=== GET MY ORGANIZATION REQUEST ===');
            if (!currentUser.orgId) {
                return (0, response_1.notFoundResponse)('El usuario no pertenece a ninguna organización');
            }
            const result = await (0, organizationService_1.getOrganizationService)(currentUser.orgId, currentUser.id);
            console.log('User organization retrieved successfully:', currentUser.orgId);
            return (0, response_1.successResponse)(result, 'Organización del usuario obtenida exitosamente');
        }
        // UPDATE ORGANIZATION SETTINGS
        if (path?.match(/\/organizations\/[^/]+\/settings$/) && httpMethod === 'PUT') {
            console.log('=== UPDATE ORGANIZATION SETTINGS REQUEST ===');
            const orgId = pathParameters?.orgId;
            if (!orgId) {
                return (0, response_1.errorResponse)('ID de organización requerido', 400);
            }
            // Validate user has owner permissions
            if (currentUser.role !== 'owner') {
                return (0, response_1.unauthorizedResponse)('Solo los propietarios pueden modificar las configuraciones de la organización');
            }
            if (currentUser.orgId !== orgId) {
                return (0, response_1.unauthorizedResponse)('No tienes permisos para modificar esta organización');
            }
            const result = await (0, organizationService_1.updateOrganizationService)(orgId, currentUser.id, { settings: requestData });
            console.log('Organization settings updated successfully:', orgId);
            return (0, response_1.successResponse)(result, 'Configuraciones de la organización actualizadas exitosamente');
        }
        // LIST ORGANIZATIONS (for admin users who might manage multiple orgs)
        if (path?.endsWith('/organizations') && httpMethod === 'GET') {
            console.log('=== LIST ORGANIZATIONS REQUEST ===');
            // For now, just return the user's organization
            // TODO: Implement proper listing logic for super-admin users
            if (!currentUser.orgId) {
                return (0, response_1.successResponse)({ organizations: [] }, 'Sin organizaciones');
            }
            const result = await (0, organizationService_1.getOrganizationService)(currentUser.orgId, currentUser.id);
            console.log('Organizations listed successfully');
            return (0, response_1.successResponse)({
                organizations: [result.organization]
            }, 'Organizaciones obtenidas exitosamente');
        }
        // Route not found
        console.log('Route not found:', path, httpMethod);
        return (0, response_1.errorResponse)('Endpoint no encontrado', 404);
    }
    catch (error) {
        console.error('=== ORGANIZATIONS HANDLER ERROR ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        // Handle known errors
        if (error.message.includes('No tienes permisos')) {
            return (0, response_1.unauthorizedResponse)(error.message);
        }
        if (error.message.includes('no encontrado') || error.message.includes('no encontrada')) {
            return (0, response_1.notFoundResponse)(error.message);
        }
        if (error.message.includes('Token')) {
            return (0, response_1.unauthorizedResponse)(error.message);
        }
        if (error.message.includes('requerido')) {
            return (0, response_1.errorResponse)(error.message, 400);
        }
        // Generic server error
        return (0, response_1.serverErrorResponse)(`Error interno del servidor: ${error.message}`);
    }
};
exports.handler = handler;
