"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAvailableSlot = exports.getAvailableTimeSlots = exports.releaseTimeSlot = exports.bookTimeSlot = exports.updateAvailability = exports.getAvailabilityByOrgAndDate = exports.getAvailabilityByEntityDateRange = exports.getAvailabilityByEntity = exports.getAvailabilityById = exports.createAvailability = void 0;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const createAvailability = async (availabilityData) => {
    const availability = {
        id: (0, uuid_1.v4)(),
        ...availabilityData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `ORG#${availability.orgId}`,
        SK: `AVAILABILITY#${availability.entityType}#${availability.entityId}#${availability.date}`,
        GSI1PK: `${availability.entityType.toUpperCase()}#${availability.entityId}`,
        GSI1SK: `DATE#${availability.date}`,
        GSI2PK: `ORG#${availability.orgId}`,
        GSI2SK: `AVAILABILITY#${availability.date}`,
        ...availability,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.ORGANIZATIONS, item);
    return availability;
};
exports.createAvailability = createAvailability;
const getAvailabilityById = async (orgId, availabilityId) => {
    const item = await (0, dynamodb_1.getItem)(dynamodb_1.TABLES.ORGANIZATIONS, {
        PK: `ORG#${orgId}`,
        SK: availabilityId,
    });
    if (!item)
        return null;
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...availability } = item;
    return availability;
};
exports.getAvailabilityById = getAvailabilityById;
const getAvailabilityByEntity = async (entityType, entityId, date) => {
    const result = await (0, dynamodb_1.query)(dynamodb_1.TABLES.ORGANIZATIONS, {
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
        ExpressionAttributeValues: {
            ':pk': `${entityType.toUpperCase()}#${entityId}`,
            ':sk': `DATE#${date}`,
        },
        Limit: 1,
    });
    if (!result.Items || result.Items.length === 0)
        return null;
    const item = result.Items[0];
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...availability } = item;
    return availability;
};
exports.getAvailabilityByEntity = getAvailabilityByEntity;
const getAvailabilityByEntityDateRange = async (entityType, entityId, startDate, endDate) => {
    const result = await (0, dynamodb_1.query)(dynamodb_1.TABLES.ORGANIZATIONS, {
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK BETWEEN :start AND :end',
        ExpressionAttributeValues: {
            ':pk': `${entityType.toUpperCase()}#${entityId}`,
            ':start': `DATE#${startDate}`,
            ':end': `DATE#${endDate}`,
        },
    });
    if (!result.Items)
        return [];
    return result.Items.map(item => {
        const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...availability } = item;
        return availability;
    });
};
exports.getAvailabilityByEntityDateRange = getAvailabilityByEntityDateRange;
const getAvailabilityByOrgAndDate = async (orgId, date) => {
    const result = await (0, dynamodb_1.query)(dynamodb_1.TABLES.ORGANIZATIONS, {
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK = :sk',
        ExpressionAttributeValues: {
            ':pk': `ORG#${orgId}`,
            ':sk': `AVAILABILITY#${date}`,
        },
    });
    if (!result.Items)
        return [];
    return result.Items.map(item => {
        const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...availability } = item;
        return availability;
    });
};
exports.getAvailabilityByOrgAndDate = getAvailabilityByOrgAndDate;
const updateAvailability = async (orgId, entityType, entityId, date, updates) => {
    const currentAvailability = await (0, exports.getAvailabilityByEntity)(entityType, entityId, date);
    const updatedAvailability = {
        ...currentAvailability,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `ORG#${orgId}`,
        SK: `AVAILABILITY#${entityType}#${entityId}#${date}`,
        GSI1PK: `${entityType.toUpperCase()}#${entityId}`,
        GSI1SK: `DATE#${date}`,
        GSI2PK: `ORG#${orgId}`,
        GSI2SK: `AVAILABILITY#${date}`,
        ...updatedAvailability,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.ORGANIZATIONS, item);
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...availability } = item;
    return availability;
};
exports.updateAvailability = updateAvailability;
const bookTimeSlot = async (orgId, entityType, entityId, date, startTime, endTime, appointmentId) => {
    const availability = await (0, exports.getAvailabilityByEntity)(entityType, entityId, date);
    if (!availability) {
        throw new Error('Availability record not found');
    }
    const updatedSlots = availability.timeSlots.map(slot => {
        // Check if this slot overlaps with the booking time
        if (slot.startTime >= startTime && slot.endTime <= endTime) {
            return {
                ...slot,
                isAvailable: false,
                bookedAppointmentId: appointmentId,
                reasonUnavailable: 'booked',
            };
        }
        return slot;
    });
    return (0, exports.updateAvailability)(orgId, entityType, entityId, date, {
        timeSlots: updatedSlots,
    });
};
exports.bookTimeSlot = bookTimeSlot;
const releaseTimeSlot = async (orgId, entityType, entityId, date, appointmentId) => {
    const availability = await (0, exports.getAvailabilityByEntity)(entityType, entityId, date);
    if (!availability) {
        throw new Error('Availability record not found');
    }
    const updatedSlots = availability.timeSlots.map(slot => {
        if (slot.bookedAppointmentId === appointmentId) {
            return {
                ...slot,
                isAvailable: true,
                bookedAppointmentId: undefined,
                reasonUnavailable: undefined,
                customReason: undefined,
            };
        }
        return slot;
    });
    return (0, exports.updateAvailability)(orgId, entityType, entityId, date, {
        timeSlots: updatedSlots,
    });
};
exports.releaseTimeSlot = releaseTimeSlot;
const getAvailableTimeSlots = async (entityType, entityId, date, duration // in minutes
) => {
    const availability = await (0, exports.getAvailabilityByEntity)(entityType, entityId, date);
    if (!availability || !availability.isActive) {
        return [];
    }
    return availability.timeSlots.filter(slot => slot.isAvailable &&
        getSlotDurationMinutes(slot) >= duration);
};
exports.getAvailableTimeSlots = getAvailableTimeSlots;
const findAvailableSlot = async (entityType, entityId, date, duration, preferredStartTime) => {
    const availableSlots = await (0, exports.getAvailableTimeSlots)(entityType, entityId, date, duration);
    if (availableSlots.length === 0)
        return null;
    // If preferred time is specified, try to find a slot that accommodates it
    if (preferredStartTime) {
        const preferredSlot = availableSlots.find(slot => slot.startTime <= preferredStartTime &&
            slot.endTime >= addMinutesToTime(preferredStartTime, duration));
        if (preferredSlot)
            return preferredSlot;
    }
    // Return the first available slot
    return availableSlots[0];
};
exports.findAvailableSlot = findAvailableSlot;
// Helper functions
const getSlotDurationMinutes = (slot) => {
    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    return endTotalMinutes - startTotalMinutes;
};
const addMinutesToTime = (time, minutes) => {
    const [hour, minute] = time.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + minutes;
    const newHour = Math.floor(totalMinutes / 60);
    const newMinute = totalMinutes % 60;
    return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
};
