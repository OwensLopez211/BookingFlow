"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const response_1 = require("../utils/response");
const requestMetrics_1 = require("../middleware/requestMetrics");
const auth_1 = require("../middleware/auth");
/**
 * Get request metrics and statistics
 */
const getMetricsHandler = async (event) => {
    try {
        const stats = (0, requestMetrics_1.getRequestStats)();
        const costs = (0, requestMetrics_1.estimateCosts)();
        return (0, response_1.successResponse)({
            stats,
            costs,
            generatedAt: new Date().toISOString()
        }, 'Métricas obtenidas correctamente');
    }
    catch (error) {
        console.error('Error getting metrics:', error);
        return (0, response_1.errorResponse)('Error al obtener métricas');
    }
};
// Only allow owners/admins to see metrics
exports.handler = (0, auth_1.withAuth)(getMetricsHandler, {
    requiredRoles: ['owner', 'admin']
});
