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
exports.getAvailableStaff = exports.generateStaffAvailability = exports.getStaffAvailability = exports.deactivateStaff = exports.activateStaff = exports.deleteStaff = exports.updateStaff = exports.getAllStaff = exports.getStaff = exports.createStaff = void 0;
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const staffRepo = __importStar(require("../repositories/staffRepository"));
const availabilityService = __importStar(require("../services/availabilityService"));
const createStaff = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const staffData = JSON.parse(event.body || '{}');
        const staff = await staffRepo.createStaff({
            orgId: user.orgId,
            ...staffData,
        });
        return (0, response_1.createResponse)(201, {
            message: 'Staff member created successfully',
            data: staff
        });
    }
    catch (error) {
        console.error('Create staff error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.createStaff = createStaff;
const getStaff = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const staffId = event.pathParameters?.id;
        if (!staffId) {
            return (0, response_1.createResponse)(400, { error: 'Staff ID is required' });
        }
        const staff = await staffRepo.getStaffById(user.orgId, staffId);
        if (!staff) {
            return (0, response_1.createResponse)(404, { error: 'Staff member not found' });
        }
        return (0, response_1.createResponse)(200, { data: staff });
    }
    catch (error) {
        console.error('Get staff error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getStaff = getStaff;
const getAllStaff = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const queryParams = event.queryStringParameters || {};
        const { activeOnly, role, specialty } = queryParams;
        let staff;
        if (role) {
            staff = await staffRepo.getStaffByRole(user.orgId, role, activeOnly === 'true');
        }
        else if (specialty) {
            staff = await staffRepo.getStaffBySpecialty(user.orgId, specialty);
        }
        else {
            staff = await staffRepo.getStaffByOrgId(user.orgId, activeOnly === 'true');
        }
        return (0, response_1.createResponse)(200, {
            data: staff,
            total: staff.length
        });
    }
    catch (error) {
        console.error('Get all staff error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getAllStaff = getAllStaff;
const updateStaff = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const staffId = event.pathParameters?.id;
        if (!staffId) {
            return (0, response_1.createResponse)(400, { error: 'Staff ID is required' });
        }
        const updates = JSON.parse(event.body || '{}');
        const staff = await staffRepo.updateStaff(user.orgId, staffId, updates);
        return (0, response_1.createResponse)(200, {
            message: 'Staff member updated successfully',
            data: staff
        });
    }
    catch (error) {
        console.error('Update staff error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.updateStaff = updateStaff;
const deleteStaff = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const staffId = event.pathParameters?.id;
        if (!staffId) {
            return (0, response_1.createResponse)(400, { error: 'Staff ID is required' });
        }
        await staffRepo.deleteStaff(user.orgId, staffId);
        return (0, response_1.createResponse)(200, { message: 'Staff member deleted successfully' });
    }
    catch (error) {
        console.error('Delete staff error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.deleteStaff = deleteStaff;
const activateStaff = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const staffId = event.pathParameters?.id;
        if (!staffId) {
            return (0, response_1.createResponse)(400, { error: 'Staff ID is required' });
        }
        const staff = await staffRepo.activateStaff(user.orgId, staffId);
        return (0, response_1.createResponse)(200, {
            message: 'Staff member activated successfully',
            data: staff
        });
    }
    catch (error) {
        console.error('Activate staff error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.activateStaff = activateStaff;
const deactivateStaff = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const staffId = event.pathParameters?.id;
        if (!staffId) {
            return (0, response_1.createResponse)(400, { error: 'Staff ID is required' });
        }
        const staff = await staffRepo.deactivateStaff(user.orgId, staffId);
        return (0, response_1.createResponse)(200, {
            message: 'Staff member deactivated successfully',
            data: staff
        });
    }
    catch (error) {
        console.error('Deactivate staff error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.deactivateStaff = deactivateStaff;
const getStaffAvailability = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const staffId = event.pathParameters?.id;
        if (!staffId) {
            return (0, response_1.createResponse)(400, { error: 'Staff ID is required' });
        }
        const queryParams = event.queryStringParameters || {};
        const { startDate, endDate } = queryParams;
        if (!startDate || !endDate) {
            return (0, response_1.createResponse)(400, { error: 'Start date and end date are required' });
        }
        const availability = await availabilityService.getEntityAvailability(user.orgId, 'staff', staffId, startDate, endDate);
        return (0, response_1.createResponse)(200, { data: availability });
    }
    catch (error) {
        console.error('Get staff availability error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getStaffAvailability = getStaffAvailability;
const generateStaffAvailability = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const staffId = event.pathParameters?.id;
        if (!staffId) {
            return (0, response_1.createResponse)(400, { error: 'Staff ID is required' });
        }
        const { startDate, endDate, slotDuration = 30, override = false } = JSON.parse(event.body || '{}');
        if (!startDate || !endDate) {
            return (0, response_1.createResponse)(400, { error: 'Start date and end date are required' });
        }
        await availabilityService.generateAvailabilityForStaff(user.orgId, staffId, {
            startDate,
            endDate,
            slotDuration,
            override,
        });
        return (0, response_1.createResponse)(200, { message: 'Staff availability generated successfully' });
    }
    catch (error) {
        console.error('Generate staff availability error:', error);
        return (0, response_1.createResponse)(400, { error: error.message });
    }
};
exports.generateStaffAvailability = generateStaffAvailability;
const getAvailableStaff = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const queryParams = event.queryStringParameters || {};
        const { date, duration, specialty } = queryParams;
        if (!date || !duration) {
            return (0, response_1.createResponse)(400, { error: 'Date and duration are required' });
        }
        const requiredSpecialties = specialty ? specialty.split(',') : [];
        const availableSlots = await availabilityService.findAvailableSlots(user.orgId, date, parseInt(duration), 'staff', undefined, requiredSpecialties);
        return (0, response_1.createResponse)(200, { data: availableSlots });
    }
    catch (error) {
        console.error('Get available staff error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getAvailableStaff = getAvailableStaff;
