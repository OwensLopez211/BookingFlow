"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableStaff = exports.deactivateStaff = exports.activateStaff = exports.deleteStaff = exports.updateStaff = exports.getStaffBySpecialty = exports.getStaffByRole = exports.getStaffByOrgId = exports.getStaffById = exports.createStaff = void 0;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const createStaff = async (staffData) => {
    const staff = {
        id: (0, uuid_1.v4)(),
        ...staffData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `ORG#${staff.orgId}`,
        SK: `STAFF#${staff.id}`,
        GSI1PK: `ORG#${staff.orgId}`,
        GSI1SK: `STAFF#${staff.role}`,
        GSI2PK: `STAFF#${staff.id}`,
        GSI2SK: 'PROFILE',
        ...staff,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.ORGANIZATIONS, item);
    return staff;
};
exports.createStaff = createStaff;
const getStaffById = async (orgId, staffId) => {
    const item = await (0, dynamodb_1.getItem)(dynamodb_1.TABLES.ORGANIZATIONS, {
        PK: `ORG#${orgId}`,
        SK: `STAFF#${staffId}`,
    });
    if (!item)
        return null;
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...staff } = item;
    return staff;
};
exports.getStaffById = getStaffById;
const getStaffByOrgId = async (orgId, activeOnly = false) => {
    const result = await (0, dynamodb_1.query)(dynamodb_1.TABLES.ORGANIZATIONS, {
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': `ORG#${orgId}`,
            ':sk': 'STAFF#',
        },
    });
    if (!result.Items)
        return [];
    let staff = result.Items.map(item => {
        const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...staffData } = item;
        return staffData;
    });
    if (activeOnly) {
        staff = staff.filter(s => s.isActive);
    }
    return staff;
};
exports.getStaffByOrgId = getStaffByOrgId;
const getStaffByRole = async (orgId, role, activeOnly = false) => {
    const result = await (0, dynamodb_1.query)(dynamodb_1.TABLES.ORGANIZATIONS, {
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
        ExpressionAttributeValues: {
            ':pk': `ORG#${orgId}`,
            ':sk': `STAFF#${role}`,
        },
    });
    if (!result.Items)
        return [];
    let staff = result.Items.map(item => {
        const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...staffData } = item;
        return staffData;
    });
    if (activeOnly) {
        staff = staff.filter(s => s.isActive);
    }
    return staff;
};
exports.getStaffByRole = getStaffByRole;
const getStaffBySpecialty = async (orgId, specialty) => {
    const allStaff = await (0, exports.getStaffByOrgId)(orgId, true);
    return allStaff.filter(staff => staff.specialties.includes(specialty));
};
exports.getStaffBySpecialty = getStaffBySpecialty;
const updateStaff = async (orgId, staffId, updates) => {
    const currentStaff = await (0, exports.getStaffById)(orgId, staffId);
    if (!currentStaff) {
        throw new Error('Staff member not found');
    }
    const updatedStaff = {
        ...currentStaff,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `ORG#${orgId}`,
        SK: `STAFF#${staffId}`,
        GSI1PK: `ORG#${orgId}`,
        GSI1SK: `STAFF#${updatedStaff.role}`,
        GSI2PK: `STAFF#${staffId}`,
        GSI2SK: 'PROFILE',
        ...updatedStaff,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.ORGANIZATIONS, item);
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...staff } = item;
    return staff;
};
exports.updateStaff = updateStaff;
const deleteStaff = async (orgId, staffId) => {
    await (0, dynamodb_1.deleteItem)(dynamodb_1.TABLES.ORGANIZATIONS, {
        PK: `ORG#${orgId}`,
        SK: `STAFF#${staffId}`,
    });
};
exports.deleteStaff = deleteStaff;
const activateStaff = async (orgId, staffId) => {
    return (0, exports.updateStaff)(orgId, staffId, { isActive: true });
};
exports.activateStaff = activateStaff;
const deactivateStaff = async (orgId, staffId) => {
    return (0, exports.updateStaff)(orgId, staffId, { isActive: false });
};
exports.deactivateStaff = deactivateStaff;
const getAvailableStaff = async (orgId, datetime, duration, requiredSpecialties = []) => {
    let staff = await (0, exports.getStaffByOrgId)(orgId, true);
    // Filter by specialties if required
    if (requiredSpecialties.length > 0) {
        staff = staff.filter(s => requiredSpecialties.some(specialty => s.specialties.includes(specialty)));
    }
    // TODO: Add availability checking logic here
    // This would require checking against the Availability entity and existing appointments
    return staff;
};
exports.getAvailableStaff = getAvailableStaff;
