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
exports.blockResourceTime = exports.getAvailableResources = exports.generateResourceAvailability = exports.getResourceAvailability = exports.deactivateResource = exports.activateResource = exports.deleteResource = exports.updateResource = exports.getAllResources = exports.getResource = exports.createResource = void 0;
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const resourceRepo = __importStar(require("../repositories/resourceRepository"));
const availabilityService = __importStar(require("../services/availabilityService"));
const createResource = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const resourceData = JSON.parse(event.body || '{}');
        const resource = await resourceRepo.createResource({
            orgId: user.orgId,
            ...resourceData,
        });
        return (0, response_1.createResponse)(201, {
            message: 'Resource created successfully',
            data: resource
        });
    }
    catch (error) {
        console.error('Create resource error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.createResource = createResource;
const getResource = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const resourceId = event.pathParameters?.id;
        if (!resourceId) {
            return (0, response_1.createResponse)(400, { error: 'Resource ID is required' });
        }
        const resource = await resourceRepo.getResourceById(user.orgId, resourceId);
        if (!resource) {
            return (0, response_1.createResponse)(404, { error: 'Resource not found' });
        }
        return (0, response_1.createResponse)(200, { data: resource });
    }
    catch (error) {
        console.error('Get resource error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getResource = getResource;
const getAllResources = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const queryParams = event.queryStringParameters || {};
        const { activeOnly, type } = queryParams;
        let resources;
        if (type) {
            resources = await resourceRepo.getResourcesByType(user.orgId, type, activeOnly === 'true');
        }
        else {
            resources = await resourceRepo.getResourcesByOrgId(user.orgId, activeOnly === 'true');
        }
        return (0, response_1.createResponse)(200, {
            data: resources,
            total: resources.length
        });
    }
    catch (error) {
        console.error('Get all resources error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getAllResources = getAllResources;
const updateResource = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const resourceId = event.pathParameters?.id;
        if (!resourceId) {
            return (0, response_1.createResponse)(400, { error: 'Resource ID is required' });
        }
        const updates = JSON.parse(event.body || '{}');
        const resource = await resourceRepo.updateResource(user.orgId, resourceId, updates);
        return (0, response_1.createResponse)(200, {
            message: 'Resource updated successfully',
            data: resource
        });
    }
    catch (error) {
        console.error('Update resource error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.updateResource = updateResource;
const deleteResource = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const resourceId = event.pathParameters?.id;
        if (!resourceId) {
            return (0, response_1.createResponse)(400, { error: 'Resource ID is required' });
        }
        await resourceRepo.deleteResource(user.orgId, resourceId);
        return (0, response_1.createResponse)(200, { message: 'Resource deleted successfully' });
    }
    catch (error) {
        console.error('Delete resource error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.deleteResource = deleteResource;
const activateResource = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const resourceId = event.pathParameters?.id;
        if (!resourceId) {
            return (0, response_1.createResponse)(400, { error: 'Resource ID is required' });
        }
        const resource = await resourceRepo.activateResource(user.orgId, resourceId);
        return (0, response_1.createResponse)(200, {
            message: 'Resource activated successfully',
            data: resource
        });
    }
    catch (error) {
        console.error('Activate resource error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.activateResource = activateResource;
const deactivateResource = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const resourceId = event.pathParameters?.id;
        if (!resourceId) {
            return (0, response_1.createResponse)(400, { error: 'Resource ID is required' });
        }
        const resource = await resourceRepo.deactivateResource(user.orgId, resourceId);
        return (0, response_1.createResponse)(200, {
            message: 'Resource deactivated successfully',
            data: resource
        });
    }
    catch (error) {
        console.error('Deactivate resource error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.deactivateResource = deactivateResource;
const getResourceAvailability = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const resourceId = event.pathParameters?.id;
        if (!resourceId) {
            return (0, response_1.createResponse)(400, { error: 'Resource ID is required' });
        }
        const queryParams = event.queryStringParameters || {};
        const { startDate, endDate } = queryParams;
        if (!startDate || !endDate) {
            return (0, response_1.createResponse)(400, { error: 'Start date and end date are required' });
        }
        const availability = await availabilityService.getEntityAvailability(user.orgId, 'resource', resourceId, startDate, endDate);
        return (0, response_1.createResponse)(200, { data: availability });
    }
    catch (error) {
        console.error('Get resource availability error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getResourceAvailability = getResourceAvailability;
const generateResourceAvailability = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const resourceId = event.pathParameters?.id;
        if (!resourceId) {
            return (0, response_1.createResponse)(400, { error: 'Resource ID is required' });
        }
        const { startDate, endDate, slotDuration = 30, override = false } = JSON.parse(event.body || '{}');
        if (!startDate || !endDate) {
            return (0, response_1.createResponse)(400, { error: 'Start date and end date are required' });
        }
        await availabilityService.generateAvailabilityForResource(user.orgId, resourceId, {
            startDate,
            endDate,
            slotDuration,
            override,
        });
        return (0, response_1.createResponse)(200, { message: 'Resource availability generated successfully' });
    }
    catch (error) {
        console.error('Generate resource availability error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.generateResourceAvailability = generateResourceAvailability;
const getAvailableResources = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const queryParams = event.queryStringParameters || {};
        const { date, duration, type } = queryParams;
        if (!date || !duration) {
            return (0, response_1.createResponse)(400, { error: 'Date and duration are required' });
        }
        const availableSlots = await availabilityService.findAvailableSlots(user.orgId, date, parseInt(duration), 'resource');
        // Filter by type if specified
        let filteredSlots = availableSlots;
        if (type) {
            const resourcesOfType = await resourceRepo.getResourcesByType(user.orgId, type, true);
            const resourceIds = resourcesOfType.map(r => r.id);
            filteredSlots = availableSlots.filter(slot => resourceIds.includes(slot.entityId));
        }
        return (0, response_1.createResponse)(200, { data: filteredSlots });
    }
    catch (error) {
        console.error('Get available resources error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getAvailableResources = getAvailableResources;
const blockResourceTime = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const resourceId = event.pathParameters?.id;
        if (!resourceId) {
            return (0, response_1.createResponse)(400, { error: 'Resource ID is required' });
        }
        const { date, startTime, endTime, reason, customReason } = JSON.parse(event.body || '{}');
        if (!date || !startTime || !endTime || !reason) {
            return (0, response_1.createResponse)(400, { error: 'Date, start time, end time, and reason are required' });
        }
        await availabilityService.blockTimeSlot(user.orgId, 'resource', resourceId, date, startTime, endTime, reason, customReason);
        return (0, response_1.createResponse)(200, { message: 'Resource time blocked successfully' });
    }
    catch (error) {
        console.error('Block resource time error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.blockResourceTime = blockResourceTime;
