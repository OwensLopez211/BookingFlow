"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverErrorResponse = exports.notFoundResponse = exports.unauthorizedResponse = exports.errorResponse = exports.successResponse = exports.createResponse = void 0;
const createResponse = (statusCode, data, error, message) => {
    const body = {
        success: statusCode >= 200 && statusCode < 300,
        ...(data && { data }),
        ...(error && { error }),
        ...(message && { message }),
        timestamp: new Date().toISOString(),
    };
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify(body),
    };
};
exports.createResponse = createResponse;
const successResponse = (data, message) => (0, exports.createResponse)(200, data, undefined, message);
exports.successResponse = successResponse;
const errorResponse = (error, statusCode = 400) => (0, exports.createResponse)(statusCode, undefined, error);
exports.errorResponse = errorResponse;
const unauthorizedResponse = (message = 'No autorizado') => (0, exports.createResponse)(401, undefined, message);
exports.unauthorizedResponse = unauthorizedResponse;
const notFoundResponse = (message = 'Recurso no encontrado') => (0, exports.createResponse)(404, undefined, message);
exports.notFoundResponse = notFoundResponse;
const serverErrorResponse = (message = 'Error interno del servidor') => (0, exports.createResponse)(500, undefined, message);
exports.serverErrorResponse = serverErrorResponse;
