"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultOrganizationSettings = exports.updateOrganization = exports.getOrganizationById = exports.createOrganization = void 0;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
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
    const updatedOrganization = {
        ...updates,
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
            limits: {
                maxResources: templateType === 'beauty_salon' ? 2 : 1,
                maxAppointmentsPerMonth: 100,
                maxUsers: 3,
            },
        },
    };
};
exports.getDefaultOrganizationSettings = getDefaultOrganizationSettings;
