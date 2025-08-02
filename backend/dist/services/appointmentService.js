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
exports.getAppointmentsByDateRange = exports.rescheduleAppointment = exports.cancelAppointment = exports.updateAppointment = exports.createAppointment = void 0;
const appointmentRepo = __importStar(require("../repositories/appointmentRepository"));
const businessConfigRepo = __importStar(require("../repositories/businessConfigurationRepository"));
const availabilityService = __importStar(require("./availabilityService"));
const createAppointment = async (request) => {
    // Get business configuration to understand appointment model
    const businessConfig = await businessConfigRepo.getBusinessConfigurationByOrgId(request.orgId);
    if (!businessConfig) {
        throw new Error('Business configuration not found');
    }
    // Validate appointment timing
    await validateAppointmentTiming(request, businessConfig);
    // Determine assignment based on business model
    const assignment = await determineAppointmentAssignment(request, businessConfig);
    // Reserve the time slots
    await reserveTimeSlots(request, assignment);
    // Create the appointment
    const appointmentData = {
        orgId: request.orgId,
        staffId: assignment.staffId,
        resourceId: assignment.resourceId,
        clientInfo: request.clientInfo,
        serviceInfo: request.serviceInfo,
        datetime: request.datetime,
        duration: request.duration,
        status: businessConfig.settings.notificationSettings.requireConfirmation ? 'pending' : 'confirmed',
        assignmentType: assignment.assignmentType,
        notes: request.notes,
        customFields: request.customFields,
    };
    try {
        const appointment = await appointmentRepo.createAppointment(appointmentData);
        // TODO: Send notifications if configured
        return appointment;
    }
    catch (error) {
        // If appointment creation fails, release the reserved slots
        await releaseReservedSlots(request, assignment);
        throw error;
    }
};
exports.createAppointment = createAppointment;
const updateAppointment = async (orgId, appointmentId, updates) => {
    const currentAppointment = await appointmentRepo.getAppointmentById(orgId, appointmentId);
    if (!currentAppointment) {
        throw new Error('Appointment not found');
    }
    // If datetime or assignments are changing, handle slot reservations
    const isRescheduling = updates.datetime && updates.datetime !== currentAppointment.datetime;
    const isReassigning = updates.staffId !== currentAppointment.staffId ||
        updates.resourceId !== currentAppointment.resourceId;
    if (isRescheduling || isReassigning) {
        // Release current slots
        await releaseCurrentSlots(currentAppointment);
        // Reserve new slots
        const newAssignment = {
            staffId: updates.staffId ?? currentAppointment.staffId,
            resourceId: updates.resourceId ?? currentAppointment.resourceId,
            assignmentType: updates.assignmentType ?? currentAppointment.assignmentType,
        };
        const tempRequest = {
            orgId,
            clientInfo: currentAppointment.clientInfo,
            serviceInfo: currentAppointment.serviceInfo,
            datetime: updates.datetime ?? currentAppointment.datetime,
            duration: updates.duration ?? currentAppointment.duration,
        };
        await reserveTimeSlots(tempRequest, newAssignment);
    }
    return appointmentRepo.updateAppointment(orgId, appointmentId, updates);
};
exports.updateAppointment = updateAppointment;
const cancelAppointment = async (orgId, appointmentId, cancelledBy, reason) => {
    const appointment = await appointmentRepo.getAppointmentById(orgId, appointmentId);
    if (!appointment) {
        throw new Error('Appointment not found');
    }
    // Release the time slots
    await releaseCurrentSlots(appointment);
    // Apply cancellation policy if applicable
    const businessConfig = await businessConfigRepo.getBusinessConfigurationByOrgId(orgId);
    let penaltyApplied = 0;
    if (businessConfig && cancelledBy === 'client') {
        const hoursUntilAppointment = getHoursUntilAppointment(appointment.datetime);
        if (hoursUntilAppointment < businessConfig.settings.cancellationPolicy.hoursBeforeAppointment) {
            penaltyApplied = businessConfig.settings.cancellationPolicy.penaltyPercentage || 0;
        }
    }
    return appointmentRepo.cancelAppointment(orgId, appointmentId, cancelledBy, reason, penaltyApplied);
};
exports.cancelAppointment = cancelAppointment;
const rescheduleAppointment = async (orgId, appointmentId, newDatetime, rescheduledBy, reason) => {
    const appointment = await appointmentRepo.getAppointmentById(orgId, appointmentId);
    if (!appointment) {
        throw new Error('Appointment not found');
    }
    // Validate new timing
    const businessConfig = await businessConfigRepo.getBusinessConfigurationByOrgId(orgId);
    if (businessConfig) {
        const tempRequest = {
            orgId,
            clientInfo: appointment.clientInfo,
            serviceInfo: appointment.serviceInfo,
            datetime: newDatetime,
            duration: appointment.duration,
        };
        await validateAppointmentTiming(tempRequest, businessConfig);
    }
    // Release current slots
    await releaseCurrentSlots(appointment);
    // Reserve new slots with same assignments
    const assignment = {
        staffId: appointment.staffId,
        resourceId: appointment.resourceId,
        assignmentType: appointment.assignmentType,
    };
    const tempRequest = {
        orgId,
        clientInfo: appointment.clientInfo,
        serviceInfo: appointment.serviceInfo,
        datetime: newDatetime,
        duration: appointment.duration,
    };
    await reserveTimeSlots(tempRequest, assignment);
    return appointmentRepo.rescheduleAppointment(orgId, appointmentId, newDatetime, rescheduledBy, reason);
};
exports.rescheduleAppointment = rescheduleAppointment;
const getAppointmentsByDateRange = async (orgId, startDate, endDate, staffId, resourceId) => {
    if (staffId) {
        return appointmentRepo.getAppointmentsByStaffAndDateRange(staffId, startDate, endDate);
    }
    else if (resourceId) {
        return appointmentRepo.getAppointmentsByResource(orgId, resourceId, startDate, endDate);
    }
    else {
        return appointmentRepo.getAppointmentsByOrgAndDateRange(orgId, startDate, endDate);
    }
};
exports.getAppointmentsByDateRange = getAppointmentsByDateRange;
// Private helper functions
const validateAppointmentTiming = async (request, businessConfig) => {
    const appointmentDate = new Date(request.datetime);
    const now = new Date();
    // Check if appointment is too far in advance
    const daysInAdvance = Math.ceil((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysInAdvance > businessConfig.settings.maxAdvanceBookingDays) {
        throw new Error(`Appointments can only be booked ${businessConfig.settings.maxAdvanceBookingDays} days in advance`);
    }
    // Check if appointment is in the past
    if (appointmentDate < now) {
        throw new Error('Cannot book appointments in the past');
    }
};
const determineAppointmentAssignment = async (request, businessConfig) => {
    const appointmentDate = request.datetime.split('T')[0];
    switch (businessConfig.appointmentModel) {
        case 'professional_based':
            return await assignProfessionalBased(request, appointmentDate);
        case 'resource_based':
            return await assignResourceBased(request, appointmentDate);
        case 'hybrid':
            return await assignHybrid(request, appointmentDate, businessConfig);
        default:
            throw new Error('Invalid appointment model configuration');
    }
};
const assignProfessionalBased = async (request, appointmentDate) => {
    let staffId = request.preferredStaffId;
    if (!staffId) {
        // Auto-assign available staff
        const availableSlots = await availabilityService.findAvailableSlots(request.orgId, appointmentDate, request.duration, 'staff');
        if (availableSlots.length === 0) {
            throw new Error('No staff available for the requested time');
        }
        staffId = availableSlots[0].entityId;
    }
    // Verify staff availability
    const availableSlot = await availabilityService.findAvailableSlots(request.orgId, appointmentDate, request.duration, 'staff', staffId);
    if (availableSlot.length === 0) {
        throw new Error('Selected staff member is not available');
    }
    return {
        staffId,
        assignmentType: 'staff_only',
    };
};
const assignResourceBased = async (request, appointmentDate) => {
    let resourceId = request.preferredResourceId;
    if (!resourceId) {
        // Auto-assign available resource
        const availableSlots = await availabilityService.findAvailableSlots(request.orgId, appointmentDate, request.duration, 'resource');
        if (availableSlots.length === 0) {
            throw new Error('No resources available for the requested time');
        }
        resourceId = availableSlots[0].entityId;
    }
    // Verify resource availability
    const availableSlot = await availabilityService.findAvailableSlots(request.orgId, appointmentDate, request.duration, 'resource', resourceId);
    if (availableSlot.length === 0) {
        throw new Error('Selected resource is not available');
    }
    return {
        resourceId,
        assignmentType: 'resource_only',
    };
};
const assignHybrid = async (request, appointmentDate, businessConfig) => {
    const requiresBoth = businessConfig.settings.requireResourceAssignment;
    if (requiresBoth) {
        // Both staff and resource required
        const staffAssignment = await assignProfessionalBased(request, appointmentDate);
        const resourceAssignment = await assignResourceBased(request, appointmentDate);
        return {
            staffId: staffAssignment.staffId,
            resourceId: resourceAssignment.resourceId,
            assignmentType: 'staff_and_resource',
        };
    }
    else {
        // Either staff or resource (client preference or auto-assign)
        if (request.preferredStaffId) {
            return await assignProfessionalBased(request, appointmentDate);
        }
        else if (request.preferredResourceId) {
            return await assignResourceBased(request, appointmentDate);
        }
        else {
            // Auto-assign based on availability
            const staffSlots = await availabilityService.findAvailableSlots(request.orgId, appointmentDate, request.duration, 'staff');
            const resourceSlots = await availabilityService.findAvailableSlots(request.orgId, appointmentDate, request.duration, 'resource');
            if (staffSlots.length > 0) {
                return { staffId: staffSlots[0].entityId, assignmentType: 'staff_only' };
            }
            else if (resourceSlots.length > 0) {
                return { resourceId: resourceSlots[0].entityId, assignmentType: 'resource_only' };
            }
            else {
                throw new Error('No availability found for the requested time');
            }
        }
    }
};
const reserveTimeSlots = async (request, assignment) => {
    const appointmentDate = request.datetime.split('T')[0];
    const startTime = request.datetime.split('T')[1].substring(0, 5); // HH:MM
    const tempAppointmentId = `temp-${Date.now()}`; // Temporary ID for reservation
    if (assignment.staffId) {
        await availabilityService.bookSlot(request.orgId, 'staff', assignment.staffId, appointmentDate, startTime, request.duration, tempAppointmentId);
    }
    if (assignment.resourceId) {
        await availabilityService.bookSlot(request.orgId, 'resource', assignment.resourceId, appointmentDate, startTime, request.duration, tempAppointmentId);
    }
};
const releaseReservedSlots = async (request, assignment) => {
    const appointmentDate = request.datetime.split('T')[0];
    const tempAppointmentId = `temp-${Date.now()}`;
    if (assignment.staffId) {
        await availabilityService.releaseSlot(request.orgId, 'staff', assignment.staffId, appointmentDate, tempAppointmentId);
    }
    if (assignment.resourceId) {
        await availabilityService.releaseSlot(request.orgId, 'resource', assignment.resourceId, appointmentDate, tempAppointmentId);
    }
};
const releaseCurrentSlots = async (appointment) => {
    const appointmentDate = appointment.datetime.split('T')[0];
    if (appointment.staffId) {
        await availabilityService.releaseSlot(appointment.orgId, 'staff', appointment.staffId, appointmentDate, appointment.id);
    }
    if (appointment.resourceId) {
        await availabilityService.releaseSlot(appointment.orgId, 'resource', appointment.resourceId, appointmentDate, appointment.id);
    }
};
const getHoursUntilAppointment = (appointmentDatetime) => {
    const appointmentDate = new Date(appointmentDatetime);
    const now = new Date();
    return Math.ceil((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60));
};
