"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugAllAppointments = exports.markNoShow = exports.completeAppointment = exports.confirmAppointment = exports.getAppointmentStats = exports.getAppointments = exports.rescheduleAppointment = exports.cancelAppointment = exports.updateAppointment = exports.getAppointment = exports.createAppointment = void 0;
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const appointmentService = __importStar(require("../services/appointmentService"));
const appointmentRepo = __importStar(require("../repositories/appointmentRepository"));
const createAppointment = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const requestBody = JSON.parse(event.body || '{}');
        const appointment = await appointmentService.createAppointment({
            orgId: user.orgId,
            ...requestBody,
        });
        return (0, response_1.createResponse)(201, {
            message: 'Appointment created successfully',
            data: appointment
        });
    }
    catch (error) {
        console.error('Create appointment error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.createAppointment = createAppointment;
const getAppointment = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const appointmentId = event.pathParameters?.id;
        if (!appointmentId) {
            return (0, response_1.createResponse)(400, { error: 'Appointment ID is required' });
        }
        const appointment = await appointmentRepo.getAppointmentById(user.orgId, appointmentId);
        if (!appointment) {
            return (0, response_1.createResponse)(404, { error: 'Appointment not found' });
        }
        return (0, response_1.createResponse)(200, { data: appointment });
    }
    catch (error) {
        console.error('Get appointment error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getAppointment = getAppointment;
const updateAppointment = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const appointmentId = event.pathParameters?.id;
        if (!appointmentId) {
            return (0, response_1.createResponse)(400, { error: 'Appointment ID is required' });
        }
        const updates = JSON.parse(event.body || '{}');
        const appointment = await appointmentService.updateAppointment(user.orgId, appointmentId, updates);
        return (0, response_1.createResponse)(200, {
            message: 'Appointment updated successfully',
            data: appointment
        });
    }
    catch (error) {
        console.error('Update appointment error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.updateAppointment = updateAppointment;
const cancelAppointment = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const appointmentId = event.pathParameters?.id;
        if (!appointmentId) {
            return (0, response_1.createResponse)(400, { error: 'Appointment ID is required' });
        }
        const { reason } = JSON.parse(event.body || '{}');
        const appointment = await appointmentService.cancelAppointment(user.orgId, appointmentId, 'admin', // TODO: Determine cancellation source based on user role
        reason);
        return (0, response_1.createResponse)(200, {
            message: 'Appointment cancelled successfully',
            data: appointment
        });
    }
    catch (error) {
        console.error('Cancel appointment error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.cancelAppointment = cancelAppointment;
const rescheduleAppointment = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const appointmentId = event.pathParameters?.id;
        if (!appointmentId) {
            return (0, response_1.createResponse)(400, { error: 'Appointment ID is required' });
        }
        const { newDatetime, reason } = JSON.parse(event.body || '{}');
        if (!newDatetime) {
            return (0, response_1.createResponse)(400, { error: 'New datetime is required' });
        }
        const appointment = await appointmentService.rescheduleAppointment(user.orgId, appointmentId, newDatetime, user.id, reason);
        return (0, response_1.createResponse)(200, {
            message: 'Appointment rescheduled successfully',
            data: appointment
        });
    }
    catch (error) {
        console.error('Reschedule appointment error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.rescheduleAppointment = rescheduleAppointment;
const getAppointments = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const queryParams = event.queryStringParameters || {};
        const { startDate, endDate, staffId, resourceId, status } = queryParams;
        if (!startDate || !endDate) {
            return (0, response_1.createResponse)(400, { error: 'Start date and end date are required' });
        }
        let appointments = await appointmentService.getAppointmentsByDateRange(user.orgId, startDate, endDate, staffId, resourceId);
        // Filter by status if provided
        if (status) {
            appointments = appointments.filter(apt => apt.status === status);
        }
        return (0, response_1.createResponse)(200, {
            data: appointments,
            total: appointments.length
        });
    }
    catch (error) {
        console.error('Get appointments error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getAppointments = getAppointments;
const getAppointmentStats = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const queryParams = event.queryStringParameters || {};
        const { startDate, endDate } = queryParams;
        if (!startDate || !endDate) {
            return (0, response_1.createResponse)(400, { error: 'Start date and end date are required' });
        }
        const stats = await appointmentRepo.getAppointmentStats(user.orgId, startDate, endDate);
        return (0, response_1.createResponse)(200, { data: stats });
    }
    catch (error) {
        console.error('Get appointment stats error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getAppointmentStats = getAppointmentStats;
const confirmAppointment = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const appointmentId = event.pathParameters?.id;
        if (!appointmentId) {
            return (0, response_1.createResponse)(400, { error: 'Appointment ID is required' });
        }
        const appointment = await appointmentRepo.confirmAppointment(user.orgId, appointmentId);
        return (0, response_1.createResponse)(200, {
            message: 'Appointment confirmed successfully',
            data: appointment
        });
    }
    catch (error) {
        console.error('Confirm appointment error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.confirmAppointment = confirmAppointment;
const completeAppointment = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const appointmentId = event.pathParameters?.id;
        if (!appointmentId) {
            return (0, response_1.createResponse)(400, { error: 'Appointment ID is required' });
        }
        const appointment = await appointmentRepo.completeAppointment(user.orgId, appointmentId);
        return (0, response_1.createResponse)(200, {
            message: 'Appointment completed successfully',
            data: appointment
        });
    }
    catch (error) {
        console.error('Complete appointment error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.completeAppointment = completeAppointment;
const markNoShow = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const appointmentId = event.pathParameters?.id;
        if (!appointmentId) {
            return (0, response_1.createResponse)(400, { error: 'Appointment ID is required' });
        }
        const appointment = await appointmentRepo.markNoShow(user.orgId, appointmentId);
        return (0, response_1.createResponse)(200, {
            message: 'Appointment marked as no-show',
            data: appointment
        });
    }
    catch (error) {
        console.error('Mark no-show error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.markNoShow = markNoShow;
const debugAllAppointments = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const queryParams = event.queryStringParameters || {};
        const limit = queryParams.limit ? parseInt(queryParams.limit) : 50;
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        const appointments = await appointmentRepo.getAppointmentsByOrgAndDateRange(user.orgId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
        const limitedAppointments = appointments.slice(0, limit);
        return (0, response_1.createResponse)(200, {
            message: `Debug: Found ${appointments.length} total appointments`,
            data: {
                totalCount: appointments.length,
                returnedCount: limitedAppointments.length,
                appointments: limitedAppointments,
                queryInfo: {
                    orgId: user.orgId,
                    dateRange: {
                        start: startDate.toISOString().split('T')[0],
                        end: endDate.toISOString().split('T')[0]
                    },
                    limit
                }
            }
        });
    }
    catch (error) {
        console.error('Debug appointments error:', error);
        return (0, response_1.createResponse)(500, { error: error.message });
    }
};
exports.debugAllAppointments = debugAllAppointments;
