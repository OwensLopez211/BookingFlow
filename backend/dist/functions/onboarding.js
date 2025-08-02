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
exports.resetOnboarding = exports.syncOnboardingToOrganization = exports.updateOnboardingStep = exports.getOnboardingStatus = void 0;
const response_1 = require("../utils/response");
const cognito_1 = require("../utils/cognito");
const userRepository_1 = require("../repositories/userRepository");
const businessConfigurationRepository_1 = require("../repositories/businessConfigurationRepository");
const organizationRepository_1 = require("../repositories/organizationRepository");
const onboardingEvents_1 = require("../events/onboardingEvents");
const onboardingDataHandlers_1 = require("../handlers/onboardingDataHandlers");
const getOnboardingStatus = async (event) => {
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
        return (0, response_1.createResponse)(200, {
            onboardingStatus: user.onboardingStatus || {
                isCompleted: false,
                currentStep: 1,
                completedSteps: [],
                startedAt: new Date().toISOString(),
            }
        });
    }
    catch (error) {
        console.error('Error getting onboarding status:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.getOnboardingStatus = getOnboardingStatus;
const updateOnboardingStep = async (event) => {
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
        if (!event.body) {
            return (0, response_1.createResponse)(400, { error: 'Request body is required' });
        }
        const { stepNumber, stepData } = JSON.parse(event.body);
        console.log(`=== ONBOARDING UPDATE REQUEST ===`);
        console.log(`Step: ${stepNumber}`);
        console.log(`Data:`, JSON.stringify(stepData, null, 2));
        console.log(`User ID: ${user.id}`);
        if (!stepNumber || !stepData) {
            console.log(`❌ Missing required fields: stepNumber=${stepNumber}, stepData=${!!stepData}`);
            return (0, response_1.createResponse)(400, { error: 'stepNumber and stepData are required' });
        }
        if (stepNumber < 1 || stepNumber > 5) {
            console.log(`❌ Invalid step number: ${stepNumber}`);
            return (0, response_1.createResponse)(400, { error: 'stepNumber must be between 1 and 5' });
        }
        // Validate step data based on step number
        console.log(`🔍 Validating step ${stepNumber} data...`);
        const validationResult = validateStepData(stepNumber, stepData);
        if (!validationResult.isValid) {
            console.log(`❌ Validation failed: ${validationResult.error}`);
            return (0, response_1.createResponse)(400, { error: validationResult.error });
        }
        console.log(`✅ Validation passed for step ${stepNumber}`);
        // Initialize event handlers (solo la primera vez)
        (0, onboardingDataHandlers_1.initializeOnboardingHandlers)();
        // Update user onboarding status
        const updatedUser = await (0, userRepository_1.updateUserOnboarding)(user.id, stepNumber, stepData);
        if (!updatedUser) {
            return (0, response_1.createResponse)(500, { error: 'Failed to update onboarding status' });
        }
        // Emit event for step completion to trigger automatic data synchronization
        if (user.orgId) {
            onboardingEvents_1.onboardingEventEmitter.emitStepCompleted({
                userId: user.id,
                orgId: user.orgId,
                stepNumber,
                stepData,
                timestamp: new Date().toISOString()
            });
            // If onboarding is completed, emit completion event
            if (updatedUser.onboardingStatus?.isCompleted) {
                onboardingEvents_1.onboardingEventEmitter.emitOnboardingCompleted({
                    userId: user.id,
                    orgId: user.orgId,
                    onboardingData: {
                        completedSteps: updatedUser.onboardingStatus.completedSteps || []
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }
        return (0, response_1.createResponse)(200, {
            message: 'Onboarding step updated successfully',
            onboardingStatus: updatedUser.onboardingStatus
        });
    }
    catch (error) {
        console.error('Error updating onboarding step:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.updateOnboardingStep = updateOnboardingStep;
const validateStepData = (stepNumber, stepData) => {
    switch (stepNumber) {
        case 1: // Industry Selection
            if (!stepData.industryType) {
                return { isValid: false, error: 'industryType is required for step 1' };
            }
            const validIndustries = ['beauty_salon', 'medical_clinic', 'hyperbaric_center', 'fitness_center', 'consultant', 'custom'];
            if (!validIndustries.includes(stepData.industryType)) {
                return { isValid: false, error: 'Invalid industryType' };
            }
            if (stepData.industryType === 'custom' && !stepData.customIndustryName) {
                return { isValid: false, error: 'customIndustryName is required when industryType is custom' };
            }
            break;
        case 2: // Organization Setup
            const requiredFields = ['businessName', 'timezone', 'currency'];
            for (const field of requiredFields) {
                if (!stepData[field]) {
                    return { isValid: false, error: `${field} is required for step 2` };
                }
            }
            break;
        case 3: // Business Configuration
            const requiredConfigFields = ['appointmentModel', 'allowClientSelection', 'bufferBetweenAppointments', 'maxAdvanceBookingDays'];
            for (const field of requiredConfigFields) {
                if (stepData[field] === undefined || stepData[field] === null) {
                    return { isValid: false, error: `${field} is required for step 3` };
                }
            }
            const validModels = ['professional_based', 'resource_based', 'hybrid'];
            if (!validModels.includes(stepData.appointmentModel)) {
                return { isValid: false, error: 'Invalid appointmentModel' };
            }
            break;
        case 4: // Services Setup
            if (!stepData.services || !Array.isArray(stepData.services)) {
                return { isValid: false, error: 'services array is required for step 4' };
            }
            // Validate each service has required fields
            for (const service of stepData.services) {
                if (!service.name || !service.duration || service.price === undefined) {
                    return { isValid: false, error: 'Each service must have name, duration, and price' };
                }
            }
            break;
        case 5: // Plan Selection
            if (!stepData.planId) {
                return { isValid: false, error: 'planId is required for step 5' };
            }
            const validPlans = ['basic', 'professional', 'enterprise'];
            if (!validPlans.includes(stepData.planId)) {
                return { isValid: false, error: 'Invalid planId. Valid plans are: ' + validPlans.join(', ') };
            }
            // Allow all plans now that we have proper implementation
            console.log(`Plan validation passed for: ${stepData.planId}`);
            break;
        default:
            return { isValid: false, error: 'Invalid step number' };
    }
    return { isValid: true };
};
const getPlanLimits = (planId) => {
    switch (planId) {
        case 'basic':
            return {
                plan: 'free',
                limits: {
                    maxResources: 1,
                    maxAppointmentsPerMonth: 100,
                    maxUsers: 3
                }
            };
        case 'professional':
            return {
                plan: 'premium',
                limits: {
                    maxResources: 5,
                    maxAppointmentsPerMonth: 1000,
                    maxUsers: 10
                }
            };
        case 'enterprise':
            return {
                plan: 'premium',
                limits: {
                    maxResources: -1, // unlimited
                    maxAppointmentsPerMonth: -1, // unlimited
                    maxUsers: -1 // unlimited
                }
            };
        default:
            // Default to basic plan
            return {
                plan: 'free',
                limits: {
                    maxResources: 1,
                    maxAppointmentsPerMonth: 100,
                    maxUsers: 3
                }
            };
    }
};
const syncOnboardingDataToOrganization = async (user) => {
    if (!user.orgId || !user.onboardingStatus?.completedSteps) {
        return;
    }
    const organizationUpdates = {
        settings: {}
    };
    // Process all completed steps to build organization settings
    for (const step of user.onboardingStatus.completedSteps) {
        switch (step.stepNumber) {
            case 2: // Organization Setup
                if (step.data) {
                    organizationUpdates.name = step.data.businessName;
                    organizationUpdates.address = step.data.businessAddress;
                    organizationUpdates.phone = step.data.businessPhone;
                    organizationUpdates.email = step.data.businessEmail;
                    organizationUpdates.currency = step.data.currency;
                    organizationUpdates.settings.timezone = step.data.timezone;
                    // Properly map businessHours from onboarding to organization format
                    if (step.data.businessHours) {
                        organizationUpdates.settings.businessHours = step.data.businessHours;
                    }
                }
                break;
            case 3: // Business Configuration  
                if (step.data) {
                    // Store business configuration settings in organization
                    organizationUpdates.settings.businessConfiguration = {
                        appointmentModel: step.data.appointmentModel,
                        allowClientSelection: step.data.allowClientSelection,
                        bufferBetweenAppointments: step.data.bufferBetweenAppointments,
                        maxAdvanceBookingDays: step.data.maxAdvanceBookingDays
                    };
                }
                break;
            case 4: // Services Setup
                if (step.data && step.data.services) {
                    // Store services configuration
                    organizationUpdates.settings.services = step.data.services;
                }
                break;
            case 5: // Plan Selection
                if (step.data && step.data.planId) {
                    // Update subscription plan using centralized logic
                    const planLimits = getPlanLimits(step.data.planId);
                    organizationUpdates.subscription = {
                        plan: planLimits.plan,
                        limits: planLimits.limits
                    };
                    // Add trial information for basic plan
                    if (step.data.planId === 'basic') {
                        const now = new Date();
                        const trialDays = step.data.trialDays || 30;
                        const endDate = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000));
                        organizationUpdates.subscription.trial = {
                            isActive: true,
                            startDate: now.toISOString(),
                            endDate: endDate.toISOString(),
                            daysTotal: trialDays
                        };
                    }
                }
                break;
        }
    }
    // Update organization with all accumulated data
    if (Object.keys(organizationUpdates).length > 0) {
        await (0, organizationRepository_1.updateOrganization)(user.orgId, organizationUpdates);
    }
};
const handleStepSpecificLogic = async (user, stepNumber, stepData) => {
    switch (stepNumber) {
        case 2: // Update organization with business details
            if (user.orgId) {
                await (0, organizationRepository_1.updateOrganization)(user.orgId, {
                    name: stepData.businessName,
                    address: stepData.businessAddress,
                    phone: stepData.businessPhone,
                    email: stepData.businessEmail,
                    currency: stepData.currency,
                    settings: {
                        timezone: stepData.timezone,
                        businessHours: stepData.businessHours || {
                            monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                            tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                            wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                            thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                            friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                            saturday: { isOpen: true, openTime: '09:00', closeTime: '14:00' },
                            sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' }
                        }
                    }
                });
            }
            break;
        case 3: // Create business configuration
            if (user.orgId) {
                const industryType = user.onboardingStatus?.industry || 'custom';
                await (0, businessConfigurationRepository_1.createBusinessConfiguration)({
                    orgId: user.orgId,
                    industryType: industryType,
                    appointmentModel: stepData.appointmentModel,
                    settings: {
                        allowClientSelection: stepData.allowClientSelection,
                        requireResourceAssignment: false,
                        autoAssignResources: false,
                        bufferBetweenAppointments: stepData.bufferBetweenAppointments,
                        maxAdvanceBookingDays: stepData.maxAdvanceBookingDays,
                        cancellationPolicy: {
                            allowCancellation: true,
                            hoursBeforeAppointment: 24,
                            penaltyPercentage: 0,
                        },
                        notificationSettings: {
                            sendReminders: true,
                            reminderHours: [24, 2],
                            requireConfirmation: false,
                        },
                    },
                });
            }
            break;
        case 4: // Services Setup
            if (user.orgId && stepData.services) {
                // Services will be handled by syncOnboardingDataToOrganization for completed onboarding
                console.log(`User ${user.id} configured ${stepData.services.length} services`);
            }
            break;
        case 5: // Plan Selection
            if (user.orgId) {
                // Update organization subscription immediately when user selects plan
                const planLimits = getPlanLimits(stepData.planId);
                await (0, organizationRepository_1.updateOrganization)(user.orgId, {
                    subscription: {
                        plan: planLimits.plan,
                        limits: planLimits.limits
                    }
                });
                console.log(`User ${user.id} selected plan: ${stepData.planId} - Organization subscription updated`);
                // Start free trial for basic plan
                if (stepData.planId === 'basic') {
                    try {
                        const now = new Date();
                        const trialDays = stepData.trialDays || 30;
                        const endDate = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000));
                        console.log(`🎯 ONBOARDING STEP 5: Starting trial for ${user.orgId}`);
                        console.log(`📅 Trial start: ${now.toISOString()}`);
                        console.log(`📅 Trial end: ${endDate.toISOString()}`);
                        console.log(`📊 Trial days: ${trialDays}`);
                        // Update organization with trial information
                        await (0, organizationRepository_1.updateOrganization)(user.orgId, {
                            subscription: {
                                plan: planLimits.plan,
                                limits: planLimits.limits,
                                trial: {
                                    isActive: true,
                                    startDate: now.toISOString(),
                                    endDate: endDate.toISOString(),
                                    daysTotal: trialDays
                                }
                            }
                        });
                        console.log(`✅ Free trial started for organization ${user.orgId} - ${trialDays} days until ${endDate.toISOString()}`);
                    }
                    catch (error) {
                        console.error('❌ Error starting free trial:', error);
                        // Don't fail the onboarding if trial creation fails
                    }
                }
            }
            break;
    }
};
const syncOnboardingToOrganization = async (event) => {
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
        if (!user.onboardingStatus?.isCompleted) {
            return (0, response_1.createResponse)(400, { error: 'Onboarding must be completed first' });
        }
        // Force synchronization of onboarding data to organization
        await syncOnboardingDataToOrganization(user);
        return (0, response_1.createResponse)(200, {
            message: 'Onboarding data synchronized successfully with organization settings'
        });
    }
    catch (error) {
        console.error('Error syncing onboarding to organization:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.syncOnboardingToOrganization = syncOnboardingToOrganization;
const resetOnboarding = async (event) => {
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
        // Only allow reset if user is owner
        if (user.role !== 'owner') {
            return (0, response_1.createResponse)(403, { error: 'Only owners can reset onboarding' });
        }
        // Reset onboarding manually by creating a new status
        const resetOnboardingStatus = {
            isCompleted: false,
            currentStep: 1,
            completedSteps: [],
            startedAt: new Date().toISOString(),
        };
        // Update user with reset status (we need to implement this)
        const updatedUser = {
            ...user,
            onboardingStatus: resetOnboardingStatus,
            updatedAt: new Date().toISOString(),
        };
        // Save the updated user
        const item = {
            PK: `USER#${user.id}`,
            SK: 'PROFILE',
            ...updatedUser,
        };
        const { putItem, TABLES } = await Promise.resolve().then(() => __importStar(require('../utils/dynamodb')));
        await putItem(TABLES.USERS, item);
        return (0, response_1.createResponse)(200, {
            message: 'Onboarding reset successfully',
            onboardingStatus: resetOnboardingStatus
        });
    }
    catch (error) {
        console.error('Error resetting onboarding:', error);
        return (0, response_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.resetOnboarding = resetOnboarding;
