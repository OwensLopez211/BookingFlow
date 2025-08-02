"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncSpecificStep = exports.checkDataSyncStatus = exports.forceDataSync = void 0;
const response_1 = require("../utils/response");
const cognito_1 = require("../utils/cognito");
const userRepository_1 = require("../repositories/userRepository");
const onboardingDataSyncService_1 = require("../services/onboardingDataSyncService");
/**
 * Endpoint para forzar sincronización manual de datos del onboarding
 */
const forceDataSync = async (event) => {
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
        // Solo permitir a owners forzar sincronización
        if (user.role !== 'owner') {
            return (0, response_1.createResponse)(403, { error: 'Only owners can force data synchronization' });
        }
        const result = await onboardingDataSyncService_1.OnboardingDataSyncService.syncAllOnboardingData(decoded.username);
        return (0, response_1.createResponse)(200, {
            message: 'Data synchronization completed',
            syncResult: result
        });
    }
    catch (error) {
        console.error('Error forcing data sync:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.forceDataSync = forceDataSync;
/**
 * Endpoint para verificar el estado de sincronización de datos
 */
const checkDataSyncStatus = async (event) => {
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
        const syncStatus = await onboardingDataSyncService_1.OnboardingDataSyncService.verifyDataSync(decoded.username);
        return (0, response_1.createResponse)(200, {
            syncStatus,
            recommendations: generateSyncRecommendations(syncStatus)
        });
    }
    catch (error) {
        console.error('Error checking data sync status:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.checkDataSyncStatus = checkDataSyncStatus;
/**
 * Endpoint para sincronizar un step específico
 */
const syncSpecificStep = async (event) => {
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
        if (!event.body) {
            return (0, response_1.createResponse)(400, { error: 'Request body is required' });
        }
        const { stepNumber } = JSON.parse(event.body);
        if (!stepNumber || stepNumber < 1 || stepNumber > 5) {
            return (0, response_1.createResponse)(400, { error: 'Valid stepNumber (1-5) is required' });
        }
        // Encontrar los datos del step
        const completedStep = user.onboardingStatus?.completedSteps?.find((step) => step.stepNumber === stepNumber);
        if (!completedStep) {
            return (0, response_1.createResponse)(404, { error: `Step ${stepNumber} not found or not completed` });
        }
        // Sincronizar solo este step
        await onboardingDataSyncService_1.OnboardingDataSyncService.syncStepData(user.orgId, stepNumber, completedStep.data, decoded.username);
        return (0, response_1.createResponse)(200, {
            message: `Step ${stepNumber} synchronized successfully`
        });
    }
    catch (error) {
        console.error('Error syncing specific step:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.syncSpecificStep = syncSpecificStep;
// Función auxiliar para generar recomendaciones
const generateSyncRecommendations = (syncStatus) => {
    const recommendations = [];
    if (!syncStatus.isSynced) {
        recommendations.push('Your onboarding data is not fully synchronized');
        if (syncStatus.missingData.length > 0) {
            recommendations.push(`Missing data: ${syncStatus.missingData.join(', ')}`);
            recommendations.push('Consider running a manual sync to fix missing data');
        }
        if (syncStatus.inconsistencies.length > 0) {
            recommendations.push(`Data inconsistencies found: ${syncStatus.inconsistencies.join(', ')}`);
            recommendations.push('Review your onboarding data and run a manual sync');
        }
    }
    else {
        recommendations.push('All onboarding data is properly synchronized');
    }
    return recommendations;
};
