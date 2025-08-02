"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourcesRequiringStaff = exports.getAvailableResources = exports.deactivateResource = exports.activateResource = exports.deleteResource = exports.updateResource = exports.getResourcesByType = exports.getResourcesByOrgId = exports.getResourceById = exports.createResource = void 0;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const createResource = async (resourceData) => {
    const resource = {
        id: (0, uuid_1.v4)(),
        ...resourceData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `ORG#${resource.orgId}`,
        SK: `RESOURCE#${resource.id}`,
        GSI1PK: `ORG#${resource.orgId}`,
        GSI1SK: `RESOURCE#${resource.type}`,
        GSI2PK: `RESOURCE#${resource.id}`,
        GSI2SK: 'PROFILE',
        ...resource,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.ORGANIZATIONS, item);
    return resource;
};
exports.createResource = createResource;
const getResourceById = async (orgId, resourceId) => {
    const item = await (0, dynamodb_1.getItem)(dynamodb_1.TABLES.ORGANIZATIONS, {
        PK: `ORG#${orgId}`,
        SK: `RESOURCE#${resourceId}`,
    });
    if (!item)
        return null;
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...resource } = item;
    return resource;
};
exports.getResourceById = getResourceById;
const getResourcesByOrgId = async (orgId, activeOnly = false) => {
    const result = await (0, dynamodb_1.query)(dynamodb_1.TABLES.ORGANIZATIONS, {
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': `ORG#${orgId}`,
            ':sk': 'RESOURCE#',
        },
    });
    if (!result.Items)
        return [];
    let resources = result.Items.map(item => {
        const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...resourceData } = item;
        return resourceData;
    });
    if (activeOnly) {
        resources = resources.filter(r => r.isActive);
    }
    return resources;
};
exports.getResourcesByOrgId = getResourcesByOrgId;
const getResourcesByType = async (orgId, type, activeOnly = false) => {
    const result = await (0, dynamodb_1.query)(dynamodb_1.TABLES.ORGANIZATIONS, {
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
        ExpressionAttributeValues: {
            ':pk': `ORG#${orgId}`,
            ':sk': `RESOURCE#${type}`,
        },
    });
    if (!result.Items)
        return [];
    let resources = result.Items.map(item => {
        const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...resourceData } = item;
        return resourceData;
    });
    if (activeOnly) {
        resources = resources.filter(r => r.isActive);
    }
    return resources;
};
exports.getResourcesByType = getResourcesByType;
const updateResource = async (orgId, resourceId, updates) => {
    const currentResource = await (0, exports.getResourceById)(orgId, resourceId);
    if (!currentResource) {
        throw new Error('Resource not found');
    }
    const updatedResource = {
        ...currentResource,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `ORG#${orgId}`,
        SK: `RESOURCE#${resourceId}`,
        GSI1PK: `ORG#${orgId}`,
        GSI1SK: `RESOURCE#${updatedResource.type}`,
        GSI2PK: `RESOURCE#${resourceId}`,
        GSI2SK: 'PROFILE',
        ...updatedResource,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.ORGANIZATIONS, item);
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...resource } = item;
    return resource;
};
exports.updateResource = updateResource;
const deleteResource = async (orgId, resourceId) => {
    await (0, dynamodb_1.deleteItem)(dynamodb_1.TABLES.ORGANIZATIONS, {
        PK: `ORG#${orgId}`,
        SK: `RESOURCE#${resourceId}`,
    });
};
exports.deleteResource = deleteResource;
const activateResource = async (orgId, resourceId) => {
    return (0, exports.updateResource)(orgId, resourceId, { isActive: true });
};
exports.activateResource = activateResource;
const deactivateResource = async (orgId, resourceId) => {
    return (0, exports.updateResource)(orgId, resourceId, { isActive: false });
};
exports.deactivateResource = deactivateResource;
const getAvailableResources = async (orgId, datetime, duration, type) => {
    let resources = type
        ? await (0, exports.getResourcesByType)(orgId, type, true)
        : await (0, exports.getResourcesByOrgId)(orgId, true);
    // TODO: Add availability checking logic here
    // This would require checking against the Availability entity and existing appointments
    return resources;
};
exports.getAvailableResources = getAvailableResources;
const getResourcesRequiringStaff = async (orgId, staffRole) => {
    const resources = await (0, exports.getResourcesByOrgId)(orgId, true);
    return resources.filter(resource => {
        if (!resource.staffRequirements)
            return false;
        if (staffRole) {
            return resource.staffRequirements.allowedRoles.includes(staffRole);
        }
        return resource.staffRequirements.requiredStaff > 0;
    });
};
exports.getResourcesRequiringStaff = getResourcesRequiringStaff;
