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
exports.getCompatibilityReport = exports.validateMigration = exports.migrateOrganization = void 0;
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const migrationService = __importStar(require("../services/migrationService"));
const migrateOrganization = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const result = await migrationService.migrateOrganizationToFlexibleSystem(user.orgId);
        if (result.success) {
            return (0, response_1.createResponse)(200, {
                message: result.message,
                data: result.details,
            });
        }
        else {
            return (0, response_1.createResponse)(400, {
                error: result.message,
                details: result.details,
            });
        }
    }
    catch (error) {
        console.error('Migration error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.migrateOrganization = migrateOrganization;
const validateMigration = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const result = await migrationService.validateMigration(user.orgId);
        return (0, response_1.createResponse)(200, {
            message: result.message,
            success: result.success,
            data: result.details,
        });
    }
    catch (error) {
        console.error('Validation error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.validateMigration = validateMigration;
const getCompatibilityReport = async (event) => {
    try {
        const user = await (0, auth_1.authMiddleware)(event);
        if (!user.orgId) {
            return (0, response_1.createResponse)(403, { error: 'Organization access required' });
        }
        const report = await migrationService.getCompatibilityReport(user.orgId);
        return (0, response_1.createResponse)(200, { data: report });
    }
    catch (error) {
        console.error('Compatibility report error:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getCompatibilityReport = getCompatibilityReport;
