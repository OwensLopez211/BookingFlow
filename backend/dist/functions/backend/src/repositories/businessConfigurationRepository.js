"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultBusinessConfiguration = exports.updateBusinessConfiguration = exports.getBusinessConfigurationByOrgId = exports.getBusinessConfigurationById = exports.createBusinessConfiguration = void 0;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const createBusinessConfiguration = async (configData) => {
    const config = {
        id: (0, uuid_1.v4)(),
        ...configData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `ORG#${config.orgId}`,
        SK: `CONFIG#${config.id}`,
        GSI1PK: `ORG#${config.orgId}`,
        GSI1SK: 'CONFIG',
        ...config,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.ORGANIZATIONS, item);
    return config;
};
exports.createBusinessConfiguration = createBusinessConfiguration;
const getBusinessConfigurationById = async (orgId, configId) => {
    const item = await (0, dynamodb_1.getItem)(dynamodb_1.TABLES.ORGANIZATIONS, {
        PK: `ORG#${orgId}`,
        SK: `CONFIG#${configId}`,
    });
    if (!item)
        return null;
    const { PK, SK, GSI1PK, GSI1SK, ...config } = item;
    return config;
};
exports.getBusinessConfigurationById = getBusinessConfigurationById;
const getBusinessConfigurationByOrgId = async (orgId) => {
    const result = await (0, dynamodb_1.query)(dynamodb_1.TABLES.ORGANIZATIONS, {
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
        ExpressionAttributeValues: {
            ':pk': `ORG#${orgId}`,
            ':sk': 'CONFIG',
        },
        Limit: 1,
    });
    if (!result.Items || result.Items.length === 0)
        return null;
    const item = result.Items[0];
    const { PK, SK, GSI1PK, GSI1SK, ...config } = item;
    return config;
};
exports.getBusinessConfigurationByOrgId = getBusinessConfigurationByOrgId;
const updateBusinessConfiguration = async (orgId, configId, updates) => {
    const updatedConfig = {
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `ORG#${orgId}`,
        SK: `CONFIG#${configId}`,
        GSI1PK: `ORG#${orgId}`,
        GSI1SK: 'CONFIG',
        ...updatedConfig,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.ORGANIZATIONS, item);
    const { PK, SK, GSI1PK, GSI1SK, ...config } = item;
    return config;
};
exports.updateBusinessConfiguration = updateBusinessConfiguration;
const getDefaultBusinessConfiguration = (orgId, industryType) => {
    const baseConfig = {
        orgId,
        industryType,
        settings: {
            allowClientSelection: true,
            requireResourceAssignment: false,
            autoAssignResources: true,
            bufferBetweenAppointments: 15,
            maxAdvanceBookingDays: 30,
            cancellationPolicy: {
                allowCancellation: true,
                hoursBeforeAppointment: 24,
                penaltyPercentage: 0,
            },
            notificationSettings: {
                sendReminders: true,
                reminderHours: [24, 2],
                requireConfirmation: true,
            },
        },
    };
    // Industry-specific configurations
    switch (industryType) {
        case 'beauty_salon':
            return {
                ...baseConfig,
                appointmentModel: 'professional_based',
                settings: {
                    ...baseConfig.settings,
                    allowClientSelection: true,
                    requireResourceAssignment: false,
                    bufferBetweenAppointments: 10,
                },
            };
        case 'medical_clinic':
            return {
                ...baseConfig,
                appointmentModel: 'professional_based',
                settings: {
                    ...baseConfig.settings,
                    allowClientSelection: false,
                    bufferBetweenAppointments: 20,
                    cancellationPolicy: {
                        allowCancellation: true,
                        hoursBeforeAppointment: 48,
                        penaltyPercentage: 25,
                    },
                },
            };
        case 'hyperbaric_center':
            return {
                ...baseConfig,
                appointmentModel: 'resource_based',
                settings: {
                    ...baseConfig.settings,
                    allowClientSelection: false,
                    requireResourceAssignment: true,
                    autoAssignResources: true,
                    bufferBetweenAppointments: 30,
                    maxAdvanceBookingDays: 14,
                },
            };
        case 'fitness_center':
            return {
                ...baseConfig,
                appointmentModel: 'hybrid',
                settings: {
                    ...baseConfig.settings,
                    allowClientSelection: true,
                    requireResourceAssignment: true,
                    bufferBetweenAppointments: 5,
                },
            };
        case 'consultant':
            return {
                ...baseConfig,
                appointmentModel: 'professional_based',
                settings: {
                    ...baseConfig.settings,
                    allowClientSelection: false,
                    requireResourceAssignment: false,
                    bufferBetweenAppointments: 0,
                    maxAdvanceBookingDays: 60,
                },
            };
        default:
            return {
                ...baseConfig,
                appointmentModel: 'hybrid',
            };
    }
};
exports.getDefaultBusinessConfiguration = getDefaultBusinessConfiguration;
