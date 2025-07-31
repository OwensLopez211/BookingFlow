import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, query, TABLES } from '../utils/dynamodb';
import { BusinessConfiguration } from '../../../shared/types/business';

export const createBusinessConfiguration = async (
  configData: Omit<BusinessConfiguration, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BusinessConfiguration> => {
  const config: BusinessConfiguration = {
    id: uuidv4(),
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

  await putItem(TABLES.ORGANIZATIONS, item);
  return config;
};

export const getBusinessConfigurationById = async (orgId: string, configId: string): Promise<BusinessConfiguration | null> => {
  const item = await getItem(TABLES.ORGANIZATIONS, {
    PK: `ORG#${orgId}`,
    SK: `CONFIG#${configId}`,
  });

  if (!item) return null;

  const { PK, SK, GSI1PK, GSI1SK, ...config } = item;
  return config as BusinessConfiguration;
};

export const getBusinessConfigurationByOrgId = async (orgId: string): Promise<BusinessConfiguration | null> => {
  const result = await query(TABLES.ORGANIZATIONS, {
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
    ExpressionAttributeValues: {
      ':pk': `ORG#${orgId}`,
      ':sk': 'CONFIG',
    },
    Limit: 1,
  });

  if (!result.Items || result.Items.length === 0) return null;

  const item = result.Items[0];
  const { PK, SK, GSI1PK, GSI1SK, ...config } = item;
  return config as BusinessConfiguration;
};

export const updateBusinessConfiguration = async (
  orgId: string, 
  configId: string, 
  updates: Partial<BusinessConfiguration>
): Promise<BusinessConfiguration> => {
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

  await putItem(TABLES.ORGANIZATIONS, item);
  
  const { PK, SK, GSI1PK, GSI1SK, ...config } = item;
  return config as BusinessConfiguration;
};

export const getDefaultBusinessConfiguration = (
  orgId: string,
  industryType: BusinessConfiguration['industryType']
): Omit<BusinessConfiguration, 'id' | 'createdAt' | 'updatedAt'> => {
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
        appointmentModel: 'professional_based' as const,
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
        appointmentModel: 'professional_based' as const,
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
        appointmentModel: 'resource_based' as const,
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
        appointmentModel: 'hybrid' as const,
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
        appointmentModel: 'professional_based' as const,
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
        appointmentModel: 'hybrid' as const,
      };
  }
};