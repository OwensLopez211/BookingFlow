"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldCheckOnboarding = exports.withOnboardingCheck = exports.requireOnboardingComplete = void 0;
const response_1 = require("../utils/response");
const cognito_1 = require("../utils/cognito");
const userRepository_1 = require("../repositories/userRepository");
const requireOnboardingComplete = async (event) => {
    try {
        const token = event.headers.Authorization?.replace('Bearer ', '');
        if (!token) {
            return {
                isComplete: false,
                response: (0, response_1.createResponse)(401, { error: 'Token is required' })
            };
        }
        const decoded = await (0, cognito_1.verifyToken)(token);
        if (!decoded) {
            return {
                isComplete: false,
                response: (0, response_1.createResponse)(401, { error: 'Invalid token' })
            };
        }
        const user = await (0, userRepository_1.getUserByCognitoId)(decoded.username);
        if (!user) {
            return {
                isComplete: false,
                response: (0, response_1.createResponse)(404, { error: 'User not found' })
            };
        }
        // Check if onboarding is completed
        const isComplete = user.onboardingStatus?.isCompleted === true;
        if (!isComplete) {
            return {
                isComplete: false,
                user,
                response: (0, response_1.createResponse)(403, {
                    error: 'Onboarding not completed',
                    onboardingRequired: true,
                    currentStep: user.onboardingStatus?.currentStep || 1,
                    completedSteps: user.onboardingStatus?.completedSteps || []
                })
            };
        }
        return {
            isComplete: true,
            user
        };
    }
    catch (error) {
        console.error('Error checking onboarding status:', error);
        return {
            isComplete: false,
            response: (0, response_1.createResponse)(500, { error: 'Internal server error' })
        };
    }
};
exports.requireOnboardingComplete = requireOnboardingComplete;
// Middleware wrapper for Lambda functions that require completed onboarding
const withOnboardingCheck = (handler) => {
    return async (event) => {
        const onboardingCheck = await (0, exports.requireOnboardingComplete)(event);
        if (!onboardingCheck.isComplete) {
            return onboardingCheck.response;
        }
        return handler(event, onboardingCheck.user);
    };
};
exports.withOnboardingCheck = withOnboardingCheck;
// List of paths that don't require onboarding completion
const ONBOARDING_EXEMPT_PATHS = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/verify-email',
    '/onboarding/status',
    '/onboarding/update',
    '/onboarding/reset',
];
const shouldCheckOnboarding = (path) => {
    return !ONBOARDING_EXEMPT_PATHS.some(exemptPath => path.startsWith(exemptPath));
};
exports.shouldCheckOnboarding = shouldCheckOnboarding;
