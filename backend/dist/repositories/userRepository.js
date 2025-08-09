"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserOnboarding = exports.getUserByEmail = exports.getUserByCognitoId = exports.getUserById = exports.createUser = void 0;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const createUser = async (userData) => {
    const user = {
        id: (0, uuid_1.v4)(),
        ...userData,
        onboardingStatus: {
            isCompleted: false,
            currentStep: 1,
            completedSteps: [],
            startedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `USER#${user.id}`,
        SK: 'PROFILE',
        ...user,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.USERS, item);
    return user;
};
exports.createUser = createUser;
const getUserById = async (userId) => {
    const item = await (0, dynamodb_1.getItem)(dynamodb_1.TABLES.USERS, {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
    });
    if (!item)
        return null;
    const { PK, SK, ...user } = item;
    return user;
};
exports.getUserById = getUserById;
const getUserByCognitoId = async (cognitoId) => {
    const items = await (0, dynamodb_1.queryItems)(dynamodb_1.TABLES.USERS, 'cognitoId = :cognitoId', undefined, { ':cognitoId': cognitoId }, 'cognitoId-index');
    if (!items.length)
        return null;
    const { PK, SK, ...user } = items[0];
    return user;
};
exports.getUserByCognitoId = getUserByCognitoId;
const getUserByEmail = async (email) => {
    const items = await (0, dynamodb_1.queryItems)(dynamodb_1.TABLES.USERS, 'email = :email', undefined, { ':email': email }, 'email-index');
    if (!items.length)
        return null;
    const { PK, SK, ...user } = items[0];
    return user;
};
exports.getUserByEmail = getUserByEmail;
const updateUserOnboarding = async (userId, stepNumber, stepData) => {
    const user = await (0, exports.getUserById)(userId);
    if (!user)
        return null;
    const stepName = getStepName(stepNumber);
    if (!stepName)
        throw new Error('Invalid step number');
    const updatedStep = {
        stepNumber,
        stepName,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        data: stepData,
    };
    const existingStepIndex = user.onboardingStatus?.completedSteps.findIndex(step => step.stepNumber === stepNumber) ?? -1;
    const completedSteps = user.onboardingStatus?.completedSteps ?? [];
    if (existingStepIndex >= 0) {
        completedSteps[existingStepIndex] = updatedStep;
    }
    else {
        completedSteps.push(updatedStep);
    }
    // Only mark onboarding as completed when specifically completing step 5
    // and all previous steps have been completed
    const allPreviousStepsCompleted = [1, 2, 3, 4].every(step => completedSteps.some(completedStep => completedStep.stepNumber === step));
    const isOnboardingCompleted = stepNumber === 5 && allPreviousStepsCompleted;
    const nextStep = isOnboardingCompleted ? 5 : Math.min(stepNumber + 1, 5);
    console.log(`=== ONBOARDING DEBUG ===`);
    console.log(`Step: ${stepNumber}, Completed steps: ${completedSteps.length}`);
    console.log(`Is completed: ${isOnboardingCompleted}, Next step: ${nextStep}`);
    console.log(`Completed steps:`, completedSteps.map(s => s.stepNumber));
    const updatedOnboardingStatus = {
        isCompleted: isOnboardingCompleted,
        currentStep: nextStep,
        completedSteps: completedSteps.sort((a, b) => a.stepNumber - b.stepNumber),
        industry: stepNumber === 1 ? stepData.industryType : user.onboardingStatus?.industry,
        startedAt: user.onboardingStatus?.startedAt ?? new Date().toISOString(),
        completedAt: isOnboardingCompleted ? new Date().toISOString() : undefined,
    };
    const updatedUser = {
        ...user,
        onboardingStatus: updatedOnboardingStatus,
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
        ...updatedUser,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.USERS, item);
    return updatedUser;
};
exports.updateUserOnboarding = updateUserOnboarding;
const getStepName = (stepNumber) => {
    switch (stepNumber) {
        case 1: return 'industry_selection';
        case 2: return 'organization_setup';
        case 3: return 'business_configuration';
        case 4: return 'services_setup';
        case 5: return 'plan_selection';
        default: return null;
    }
};
