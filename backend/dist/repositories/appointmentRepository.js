"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppointmentStats = exports.deleteAppointment = exports.markNoShow = exports.completeAppointment = exports.confirmAppointment = exports.rescheduleAppointment = exports.cancelAppointment = exports.updateAppointment = exports.getAppointmentsByResource = exports.getAppointmentsByStaffAndDateRange = exports.getAppointmentsByStaffAndDate = exports.getAppointmentsByOrgAndDateRange = exports.getAppointmentsByOrgAndDate = exports.getAppointmentById = exports.createAppointment = void 0;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const createAppointment = async (appointmentData) => {
    const appointment = {
        id: (0, uuid_1.v4)(),
        ...appointmentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `ORG#${appointment.orgId}`,
        SK: `APPOINTMENT#${appointment.id}`,
        GSI1PK: `ORG#${appointment.orgId}`,
        GSI1SK: `DATE#${appointment.datetime.split('T')[0]}`, // YYYY-MM-DD
        GSI2PK: appointment.staffId ? `STAFF#${appointment.staffId}` : 'NO_STAFF',
        GSI2SK: `DATE#${appointment.datetime.split('T')[0]}`,
        ...appointment,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.ORGANIZATIONS, item);
    return appointment;
};
exports.createAppointment = createAppointment;
const getAppointmentById = async (orgId, appointmentId) => {
    const item = await (0, dynamodb_1.getItem)(dynamodb_1.TABLES.ORGANIZATIONS, {
        PK: `ORG#${orgId}`,
        SK: `APPOINTMENT#${appointmentId}`,
    });
    if (!item)
        return null;
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...appointment } = item;
    return appointment;
};
exports.getAppointmentById = getAppointmentById;
const getAppointmentsByOrgAndDate = async (orgId, date) => {
    const command = new lib_dynamodb_1.QueryCommand({
        TableName: dynamodb_1.TABLES.ORGANIZATIONS,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
        ExpressionAttributeValues: {
            ':pk': `ORG#${orgId}`,
            ':sk': `DATE#${date}`,
        },
    });
    const result = await dynamodb_1.dynamoClient.send(command);
    if (!result.Items)
        return [];
    return result.Items.map(item => {
        const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...appointment } = item;
        return appointment;
    });
};
exports.getAppointmentsByOrgAndDate = getAppointmentsByOrgAndDate;
const getAppointmentsByOrgAndDateRange = async (orgId, startDate, endDate) => {
    const command = new lib_dynamodb_1.QueryCommand({
        TableName: dynamodb_1.TABLES.ORGANIZATIONS,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK BETWEEN :start AND :end',
        ExpressionAttributeValues: {
            ':pk': `ORG#${orgId}`,
            ':start': `DATE#${startDate}`,
            ':end': `DATE#${endDate}`,
        },
    });
    const result = await dynamodb_1.dynamoClient.send(command);
    if (!result.Items)
        return [];
    return result.Items.map(item => {
        const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...appointment } = item;
        return appointment;
    });
};
exports.getAppointmentsByOrgAndDateRange = getAppointmentsByOrgAndDateRange;
const getAppointmentsByStaffAndDate = async (staffId, date) => {
    const command = new lib_dynamodb_1.QueryCommand({
        TableName: dynamodb_1.TABLES.ORGANIZATIONS,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK = :sk',
        ExpressionAttributeValues: {
            ':pk': `STAFF#${staffId}`,
            ':sk': `DATE#${date}`,
        },
    });
    const result = await dynamodb_1.dynamoClient.send(command);
    if (!result.Items)
        return [];
    return result.Items.map(item => {
        const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...appointment } = item;
        return appointment;
    });
};
exports.getAppointmentsByStaffAndDate = getAppointmentsByStaffAndDate;
const getAppointmentsByStaffAndDateRange = async (staffId, startDate, endDate) => {
    const command = new lib_dynamodb_1.QueryCommand({
        TableName: dynamodb_1.TABLES.ORGANIZATIONS,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK BETWEEN :start AND :end',
        ExpressionAttributeValues: {
            ':pk': `STAFF#${staffId}`,
            ':start': `DATE#${startDate}`,
            ':end': `DATE#${endDate}`,
        },
    });
    const result = await dynamodb_1.dynamoClient.send(command);
    if (!result.Items)
        return [];
    return result.Items.map(item => {
        const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...appointment } = item;
        return appointment;
    });
};
exports.getAppointmentsByStaffAndDateRange = getAppointmentsByStaffAndDateRange;
const getAppointmentsByResource = async (orgId, resourceId, startDate, endDate) => {
    // Since we don't have a direct GSI for resource, we need to query by org and filter
    const appointments = await (0, exports.getAppointmentsByOrgAndDateRange)(orgId, startDate, endDate);
    return appointments.filter(appointment => appointment.resourceId === resourceId);
};
exports.getAppointmentsByResource = getAppointmentsByResource;
const updateAppointment = async (orgId, appointmentId, updates) => {
    const currentAppointment = await (0, exports.getAppointmentById)(orgId, appointmentId);
    if (!currentAppointment) {
        throw new Error('Appointment not found');
    }
    const updatedAppointment = {
        ...currentAppointment,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `ORG#${orgId}`,
        SK: `APPOINTMENT#${appointmentId}`,
        GSI1PK: `ORG#${orgId}`,
        GSI1SK: `DATE#${updatedAppointment.datetime.split('T')[0]}`,
        GSI2PK: updatedAppointment.staffId ? `STAFF#${updatedAppointment.staffId}` : 'NO_STAFF',
        GSI2SK: `DATE#${updatedAppointment.datetime.split('T')[0]}`,
        ...updatedAppointment,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.ORGANIZATIONS, item);
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...appointment } = item;
    return appointment;
};
exports.updateAppointment = updateAppointment;
const cancelAppointment = async (orgId, appointmentId, cancelledBy, reason, penaltyApplied) => {
    return (0, exports.updateAppointment)(orgId, appointmentId, {
        status: 'cancelled',
        cancellationInfo: {
            cancelledAt: new Date().toISOString(),
            cancelledBy,
            reason,
            penaltyApplied,
        },
    });
};
exports.cancelAppointment = cancelAppointment;
const rescheduleAppointment = async (orgId, appointmentId, newDatetime, rescheduledBy, reason) => {
    const currentAppointment = await (0, exports.getAppointmentById)(orgId, appointmentId);
    if (!currentAppointment) {
        throw new Error('Appointment not found');
    }
    const reschedulingRecord = {
        previousDatetime: currentAppointment.datetime,
        newDatetime,
        rescheduledAt: new Date().toISOString(),
        rescheduledBy,
        reason,
    };
    return (0, exports.updateAppointment)(orgId, appointmentId, {
        status: 'rescheduled',
        datetime: newDatetime,
        reschedulingHistory: [
            ...(currentAppointment.reschedulingHistory || []),
            reschedulingRecord,
        ],
    });
};
exports.rescheduleAppointment = rescheduleAppointment;
const confirmAppointment = async (orgId, appointmentId) => {
    return (0, exports.updateAppointment)(orgId, appointmentId, { status: 'confirmed' });
};
exports.confirmAppointment = confirmAppointment;
const completeAppointment = async (orgId, appointmentId) => {
    return (0, exports.updateAppointment)(orgId, appointmentId, { status: 'completed' });
};
exports.completeAppointment = completeAppointment;
const markNoShow = async (orgId, appointmentId) => {
    return (0, exports.updateAppointment)(orgId, appointmentId, { status: 'no_show' });
};
exports.markNoShow = markNoShow;
const deleteAppointment = async (orgId, appointmentId) => {
    await (0, dynamodb_1.deleteItem)(dynamodb_1.TABLES.ORGANIZATIONS, {
        PK: `ORG#${orgId}`,
        SK: `APPOINTMENT#${appointmentId}`,
    });
};
exports.deleteAppointment = deleteAppointment;
const getAppointmentStats = async (orgId, startDate, endDate) => {
    const appointments = await (0, exports.getAppointmentsByOrgAndDateRange)(orgId, startDate, endDate);
    const stats = {
        total: appointments.length,
        confirmed: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
    };
    appointments.forEach(appointment => {
        switch (appointment.status) {
            case 'confirmed':
                stats.confirmed++;
                break;
            case 'pending':
                stats.pending++;
                break;
            case 'completed':
                stats.completed++;
                break;
            case 'cancelled':
                stats.cancelled++;
                break;
            case 'no_show':
                stats.noShow++;
                break;
        }
    });
    return stats;
};
exports.getAppointmentStats = getAppointmentStats;
