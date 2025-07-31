"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const authService_1 = require("../services/authService");
const response_1 = require("../utils/response");
const cognito_1 = require("../utils/cognito");
const handler = async (event) => {
    console.log('=== AUTH HANDLER ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    try {
        const { httpMethod, path, body, headers } = event;
        // Handle CORS preflight
        if (httpMethod === 'OPTIONS') {
            return (0, response_1.createResponse)(200);
        }
        // Parse request body
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
        // REGISTER ENDPOINT
        if (path?.endsWith('/auth/register') && httpMethod === 'POST') {
            console.log('=== REGISTER REQUEST ===');
            const { email, password, firstName, lastName, organizationName, templateType } = requestData;
            // Basic validation
            if (!email || !password || !firstName || !lastName || !organizationName || !templateType) {
                return (0, response_1.errorResponse)('Todos los campos son requeridos', 400);
            }
            const result = await (0, authService_1.registerUserAndOrganization)({
                email,
                password,
                firstName,
                lastName,
                organizationName,
                templateType,
            });
            console.log('Registration successful for:', email);
            return (0, response_1.successResponse)(result, 'Usuario registrado exitosamente');
        }
        // LOGIN ENDPOINT
        if (path?.endsWith('/auth/login') && httpMethod === 'POST') {
            console.log('=== LOGIN REQUEST ===');
            const { email, password } = requestData;
            if (!email || !password) {
                return (0, response_1.errorResponse)('Email y contraseña son requeridos', 400);
            }
            const result = await (0, authService_1.loginUserService)({ email, password });
            console.log('Login successful for:', email);
            return (0, response_1.successResponse)(result, 'Login exitoso');
        }
        // FORGOT PASSWORD ENDPOINT
        if (path?.endsWith('/auth/forgot-password') && httpMethod === 'POST') {
            console.log('=== FORGOT PASSWORD REQUEST ===');
            const { email } = requestData;
            if (!email) {
                return (0, response_1.errorResponse)('Email es requerido', 400);
            }
            const result = await (0, cognito_1.forgotPassword)(email);
            console.log('Forgot password request for:', email);
            return (0, response_1.successResponse)(result, 'Código de recuperación enviado');
        }
        // RESET PASSWORD ENDPOINT
        if (path?.endsWith('/auth/reset-password') && httpMethod === 'POST') {
            console.log('=== RESET PASSWORD REQUEST ===');
            const { email, confirmationCode, newPassword } = requestData;
            if (!email || !confirmationCode || !newPassword) {
                return (0, response_1.errorResponse)('Email, código de confirmación y nueva contraseña son requeridos', 400);
            }
            const result = await (0, cognito_1.resetPassword)(email, confirmationCode, newPassword);
            console.log('Password reset successful for:', email);
            return (0, response_1.successResponse)(result, 'Contraseña restablecida exitosamente');
        }
        // GET CURRENT USER ENDPOINT (Protected)
        if (path?.endsWith('/auth/me') && httpMethod === 'GET') {
            console.log('=== GET CURRENT USER REQUEST ===');
            const authHeader = headers.Authorization || headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return (0, response_1.unauthorizedResponse)('Token de acceso requerido');
            }
            const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix
            const result = await (0, authService_1.getCurrentUserService)(accessToken);
            console.log('Get current user successful');
            return (0, response_1.successResponse)(result, 'Información del usuario obtenida');
        }
        // REFRESH TOKEN ENDPOINT
        if (path?.endsWith('/auth/refresh') && httpMethod === 'POST') {
            console.log('=== REFRESH TOKEN REQUEST ===');
            // TODO: Implementar refresh token logic
            return (0, response_1.errorResponse)('Endpoint de refresh token no implementado aún', 501);
        }
        // Route not found
        console.log('Route not found:', path, httpMethod);
        return (0, response_1.errorResponse)('Endpoint no encontrado', 404);
    }
    catch (error) {
        console.error('=== AUTH HANDLER ERROR ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        // Handle known errors
        if (error.message.includes('Ya existe un usuario')) {
            return (0, response_1.errorResponse)(error.message, 409); // Conflict
        }
        if (error.message.includes('Email o contraseña incorrectos')) {
            return (0, response_1.errorResponse)(error.message, 401); // Unauthorized
        }
        if (error.message.includes('Usuario no encontrado')) {
            return (0, response_1.errorResponse)(error.message, 404); // Not Found
        }
        if (error.message.includes('Token')) {
            return (0, response_1.unauthorizedResponse)(error.message);
        }
        // Generic server error
        return (0, response_1.serverErrorResponse)(`Error interno del servidor: ${error.message}`);
    }
};
exports.handler = handler;
