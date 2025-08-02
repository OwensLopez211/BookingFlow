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
exports.blockTimeSlot = exports.getEntityAvailability = exports.releaseSlot = exports.bookSlot = exports.findAvailableSlots = exports.generateAvailabilityForOrganization = exports.generateAvailabilityForResource = exports.generateAvailabilityForStaff = void 0;
const availabilityRepo = __importStar(require("../repositories/availabilityRepository"));
const staffRepo = __importStar(require("../repositories/staffRepository"));
const resourceRepo = __importStar(require("../repositories/resourceRepository"));
const generateAvailabilityForStaff = async (orgId, staffId, options) => {
    const staff = await staffRepo.getStaffById(orgId, staffId);
    if (!staff || !staff.isActive) {
        throw new Error('Staff member not found or inactive');
    }
    const dates = getDatesBetween(options.startDate, options.endDate);
    for (const date of dates) {
        const dayOfWeek = getDayOfWeek(date);
        const daySchedule = staff.schedule[dayOfWeek];
        if (!daySchedule.isAvailable) {
            continue;
        }
        // Check if availability already exists
        const existingAvailability = await availabilityRepo.getAvailabilityByEntity('staff', staffId, date);
        if (existingAvailability && !options.override) {
            continue;
        }
        const timeSlots = generateTimeSlotsFromSchedule(daySchedule, options.slotDuration);
        const availabilityData = {
            orgId,
            entityType: 'staff',
            entityId: staffId,
            date,
            timeSlots,
            isActive: true,
            override: options.override || false,
        };
        if (existingAvailability) {
            await availabilityRepo.updateAvailability(orgId, 'staff', staffId, date, availabilityData);
        }
        else {
            await availabilityRepo.createAvailability(availabilityData);
        }
    }
};
exports.generateAvailabilityForStaff = generateAvailabilityForStaff;
const generateAvailabilityForResource = async (orgId, resourceId, options) => {
    const resource = await resourceRepo.getResourceById(orgId, resourceId);
    if (!resource || !resource.isActive) {
        throw new Error('Resource not found or inactive');
    }
    const dates = getDatesBetween(options.startDate, options.endDate);
    for (const date of dates) {
        const dayOfWeek = getDayOfWeek(date);
        const daySchedule = resource.schedule[dayOfWeek];
        if (!daySchedule.isAvailable) {
            continue;
        }
        // Check if availability already exists
        const existingAvailability = await availabilityRepo.getAvailabilityByEntity('resource', resourceId, date);
        if (existingAvailability && !options.override) {
            continue;
        }
        const timeSlots = generateTimeSlotsFromSchedule(daySchedule, options.slotDuration);
        const availabilityData = {
            orgId,
            entityType: 'resource',
            entityId: resourceId,
            date,
            timeSlots,
            isActive: true,
            override: options.override || false,
        };
        if (existingAvailability) {
            await availabilityRepo.updateAvailability(orgId, 'resource', resourceId, date, availabilityData);
        }
        else {
            await availabilityRepo.createAvailability(availabilityData);
        }
    }
};
exports.generateAvailabilityForResource = generateAvailabilityForResource;
const generateAvailabilityForOrganization = async (orgId, options) => {
    // Generate for all active staff
    const staff = await staffRepo.getStaffByOrgId(orgId, true);
    for (const staffMember of staff) {
        await (0, exports.generateAvailabilityForStaff)(orgId, staffMember.id, options);
    }
    // Generate for all active resources
    const resources = await resourceRepo.getResourcesByOrgId(orgId, true);
    for (const resource of resources) {
        await (0, exports.generateAvailabilityForResource)(orgId, resource.id, options);
    }
};
exports.generateAvailabilityForOrganization = generateAvailabilityForOrganization;
const findAvailableSlots = async (orgId, date, duration, entityType, entityId, requiredSpecialties) => {
    const results = [];
    if (entityType && entityId) {
        // Specific entity requested
        const slots = await availabilityRepo.getAvailableTimeSlots(entityType, entityId, date, duration);
        if (slots.length > 0) {
            const entityName = await getEntityName(orgId, entityType, entityId);
            results.push({
                entityType,
                entityId,
                entityName,
                date,
                slots,
            });
        }
    }
    else if (entityType === 'staff') {
        // All staff availability
        let staff = await staffRepo.getStaffByOrgId(orgId, true);
        if (requiredSpecialties && requiredSpecialties.length > 0) {
            staff = staff.filter(s => requiredSpecialties.some(specialty => s.specialties.includes(specialty)));
        }
        for (const staffMember of staff) {
            const slots = await availabilityRepo.getAvailableTimeSlots('staff', staffMember.id, date, duration);
            if (slots.length > 0) {
                results.push({
                    entityType: 'staff',
                    entityId: staffMember.id,
                    entityName: `${staffMember.firstName} ${staffMember.lastName}`,
                    date,
                    slots,
                });
            }
        }
    }
    else if (entityType === 'resource') {
        // All resource availability
        const resources = await resourceRepo.getResourcesByOrgId(orgId, true);
        for (const resource of resources) {
            const slots = await availabilityRepo.getAvailableTimeSlots('resource', resource.id, date, duration);
            if (slots.length > 0) {
                results.push({
                    entityType: 'resource',
                    entityId: resource.id,
                    entityName: resource.name,
                    date,
                    slots,
                });
            }
        }
    }
    else {
        // All availability (staff and resources)
        const staffResults = await (0, exports.findAvailableSlots)(orgId, date, duration, 'staff', undefined, requiredSpecialties);
        const resourceResults = await (0, exports.findAvailableSlots)(orgId, date, duration, 'resource');
        results.push(...staffResults, ...resourceResults);
    }
    return results;
};
exports.findAvailableSlots = findAvailableSlots;
const bookSlot = async (orgId, entityType, entityId, date, startTime, duration, appointmentId) => {
    const endTime = addMinutesToTime(startTime, duration);
    // Check if slot is still available
    const availableSlot = await availabilityRepo.findAvailableSlot(entityType, entityId, date, duration, startTime);
    if (!availableSlot) {
        throw new Error('Time slot is no longer available');
    }
    // Book the slot
    await availabilityRepo.bookTimeSlot(orgId, entityType, entityId, date, startTime, endTime, appointmentId);
};
exports.bookSlot = bookSlot;
const releaseSlot = async (orgId, entityType, entityId, date, appointmentId) => {
    await availabilityRepo.releaseTimeSlot(orgId, entityType, entityId, date, appointmentId);
};
exports.releaseSlot = releaseSlot;
const getEntityAvailability = async (orgId, entityType, entityId, startDate, endDate) => {
    return availabilityRepo.getAvailabilityByEntityDateRange(entityType, entityId, startDate, endDate);
};
exports.getEntityAvailability = getEntityAvailability;
const blockTimeSlot = async (orgId, entityType, entityId, date, startTime, endTime, reason, customReason) => {
    const availability = await availabilityRepo.getAvailabilityByEntity(entityType, entityId, date);
    if (!availability) {
        throw new Error('Availability record not found');
    }
    const updatedSlots = availability.timeSlots.map(slot => {
        // Check if this slot is within the blocked time range
        if (slot.startTime >= startTime && slot.endTime <= endTime) {
            return {
                ...slot,
                isAvailable: false,
                reasonUnavailable: reason,
                customReason,
            };
        }
        return slot;
    });
    await availabilityRepo.updateAvailability(orgId, entityType, entityId, date, {
        timeSlots: updatedSlots,
    });
};
exports.blockTimeSlot = blockTimeSlot;
// Helper functions
const getDatesBetween = (startDate, endDate) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
};
const getDayOfWeek = (date) => {
    const dayIndex = new Date(date).getDay();
    const days = [
        'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
    ];
    return days[dayIndex];
};
const generateTimeSlotsFromSchedule = (daySchedule, slotDuration) => {
    const slots = [];
    const startMinutes = timeToMinutes(daySchedule.startTime);
    const endMinutes = timeToMinutes(daySchedule.endTime);
    for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += slotDuration) {
        const slotStart = minutesToTime(currentMinutes);
        const slotEnd = minutesToTime(Math.min(currentMinutes + slotDuration, endMinutes));
        // Check if this slot conflicts with any breaks
        const isBreak = daySchedule.breaks?.some(breakPeriod => {
            const breakStart = timeToMinutes(breakPeriod.startTime);
            const breakEnd = timeToMinutes(breakPeriod.endTime);
            return currentMinutes < breakEnd && (currentMinutes + slotDuration) > breakStart;
        });
        slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            isAvailable: !isBreak,
            reasonUnavailable: isBreak ? 'break' : undefined,
        });
    }
    return slots;
};
const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};
const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};
const addMinutesToTime = (time, minutes) => {
    const totalMinutes = timeToMinutes(time) + minutes;
    return minutesToTime(totalMinutes);
};
const getEntityName = async (orgId, entityType, entityId) => {
    if (entityType === 'staff') {
        const staff = await staffRepo.getStaffById(orgId, entityId);
        return staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown Staff';
    }
    else {
        const resource = await resourceRepo.getResourceById(orgId, entityId);
        return resource ? resource.name : 'Unknown Resource';
    }
};
