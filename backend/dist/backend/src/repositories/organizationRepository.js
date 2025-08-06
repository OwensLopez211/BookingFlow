"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultOrganizationSettings = exports.updateOrganization = exports.getOrganizationById = exports.createOrganization = void 0;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const PLAN_LIMITS = {
    free: {
        maxResources: 1,
        maxAppointmentsPerMonth: 100,
        maxUsers: 1,
    },
    basic: {
        maxResources: 5,
        maxAppointmentsPerMonth: 1000,
        maxUsers: 2,
    },
    premium: {
        maxResources: 10,
        maxAppointmentsPerMonth: 2500,
        maxUsers: 10,
    },
};
const createOrganization = async (orgData) => {
    const organization = {
        id: (0, uuid_1.v4)(),
        ...orgData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `ORG#${organization.id}`,
        SK: 'PROFILE',
        ...organization,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.ORGANIZATIONS, item);
    return organization;
};
exports.createOrganization = createOrganization;
const getOrganizationById = async (orgId) => {
    const item = await (0, dynamodb_1.getItem)(dynamodb_1.TABLES.ORGANIZATIONS, {
        PK: `ORG#${orgId}`,
        SK: 'PROFILE',
    });
    if (!item)
        return null;
    const { PK, SK, ...organization } = item;
    return organization;
};
exports.getOrganizationById = getOrganizationById;
const updateOrganization = async (orgId, updates) => {
    // Get current organization to merge settings properly
    const currentOrg = await (0, exports.getOrganizationById)(orgId);
    if (!currentOrg) {
        throw new Error('Organization not found');
    }
    // Merge settings properly to avoid overwriting existing configuration
    const mergedSettings = updates.settings ? {
        ...currentOrg.settings,
        ...updates.settings,
        // Ensure businessHours is properly merged
        businessHours: updates.settings.businessHours ?
            { ...currentOrg.settings.businessHours, ...updates.settings.businessHours } :
            currentOrg.settings.businessHours,
        // Ensure notifications is properly merged
        notifications: updates.settings.notifications ?
            { ...currentOrg.settings.notifications, ...updates.settings.notifications } :
            currentOrg.settings.notifications,
        // Ensure appointmentSystem is properly merged
        appointmentSystem: updates.settings.appointmentSystem ?
            { ...currentOrg.settings.appointmentSystem, ...updates.settings.appointmentSystem } :
            currentOrg.settings.appointmentSystem,
        // Ensure businessConfiguration is properly merged
        businessConfiguration: updates.settings.businessConfiguration ?
            { ...currentOrg.settings.businessConfiguration, ...updates.settings.businessConfiguration } :
            currentOrg.settings.businessConfiguration,
        // Ensure businessInfo is properly merged
        businessInfo: updates.settings.businessInfo ?
            { ...currentOrg.settings.businessInfo, ...updates.settings.businessInfo } :
            currentOrg.settings.businessInfo,
        // Ensure services is properly merged
        services: updates.settings.services || currentOrg.settings.services
    } : currentOrg.settings;
    // Merge subscription properly
    const mergedSubscription = updates.subscription ? {
        ...currentOrg.subscription,
        ...updates.subscription,
        // Ensure limits is properly merged
        limits: updates.subscription.limits ?
            { ...currentOrg.subscription.limits, ...updates.subscription.limits } :
            currentOrg.subscription.limits,
        // Ensure trial is properly merged
        trial: updates.subscription.trial ?
            { ...currentOrg.subscription.trial, ...updates.subscription.trial } :
            currentOrg.subscription.trial
    } : currentOrg.subscription;
    const updatedOrganization = {
        ...currentOrg,
        ...updates,
        settings: mergedSettings,
        subscription: mergedSubscription,
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `ORG#${orgId}`,
        SK: 'PROFILE',
        ...updatedOrganization,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.ORGANIZATIONS, item);
    // Return the updated organization
    const { PK, SK, ...organization } = item;
    return organization;
};
exports.updateOrganization = updateOrganization;
const getDefaultOrganizationSettings = (templateType) => {
    const commonSettings = {
        timezone: 'America/Santiago',
        businessHours: {
            monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            saturday: { isOpen: true, openTime: '09:00', closeTime: '15:00' },
            sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
        },
        notifications: {
            emailReminders: true,
            smsReminders: false,
            autoConfirmation: true,
            reminderHours: 24,
        },
    };
    return {
        settings: commonSettings,
        subscription: {
            plan: 'free',
            limits: PLAN_LIMITS.free,
        },
    };
};
exports.getDefaultOrganizationSettings = getDefaultOrganizationSettings;
