"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyBusinessConfiguration = void 0;
const response_1 = require("../utils/response");
const cognito_1 = require("../utils/cognito");
const userRepository_1 = require("../repositories/userRepository");
const businessConfigurationRepository_1 = require("../repositories/businessConfigurationRepository");
const getMyBusinessConfiguration = async (event) => {
    try {
        const token = event.headers.Authorization?.replace('Bearer ', '');
        if (!token) {
            return (0, response_1.createResponse)(401, { error: 'Token is required' });
        }
        const decoded = await (0, cognito_1.verifyToken)(token);
        if (!decoded) {
            return (0, response_1.createResponse)(401, { error: 'Invalid token' });
        }
        const user = await (0, userRepository_1.getUserByCognitoId)(decoded.username);
        if (!user) {
            return (0, response_1.createResponse)(404, { error: 'User not found' });
        }
        if (!user.orgId) {
            return (0, response_1.createResponse)(400, { error: 'User is not associated with an organization' });
        }
        const businessConfiguration = await (0, businessConfigurationRepository_1.getBusinessConfigurationByOrgId)(user.orgId);
        if (!businessConfiguration) {
            return (0, response_1.createResponse)(404, {
                error: 'Business configuration not found',
                message: 'Complete the onboarding process to create business configuration'
            });
        }
        return (0, response_1.createResponse)(200, {
            success: true,
            data: businessConfiguration,
            businessConfiguration
        });
    }
    catch (error) {
        console.error('Error getting business configuration:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getMyBusinessConfiguration = getMyBusinessConfiguration;
