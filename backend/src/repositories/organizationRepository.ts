import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, TABLES } from '../utils/dynamodb';

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

export interface Organization {
  id: string;
  name: string;
  templateType: 'beauty_salon' | 'hyperbaric_center' | 'medical_clinic' | 'fitness_center' | 'consultant' | 'custom';
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  settings: {
    timezone: string;
    businessHours: {
      [key: string]: {
        isOpen: boolean;
        openTime: string;
        closeTime: string;
      };
    };
    notifications: {
      emailReminders?: boolean;
      smsReminders?: boolean;
      autoConfirmation?: boolean;
      reminderHours?: number;
    };
    appointmentSystem?: {
      appointmentModel: string;
      allowClientSelection: boolean;
      bufferBetweenAppointments: number;
      maxAdvanceBookingDays: number;
      maxProfessionals?: number;
      maxResources?: number;
      maxResourcesPerSlot?: number;
      professionals?: Array<{
        id: string;
        name: string;
        photo?: string;
        isActive: boolean;
      }>;
    };
    businessConfiguration?: {
      appointmentModel: string;
      allowClientSelection: boolean;
      bufferBetweenAppointments: number;
      maxAdvanceBookingDays: number;
      maxProfessionals?: number;
      maxResources?: number;
      maxResourcesPerSlot?: number;
      professionals?: Array<{
        id: string;
        name: string;
        photo?: string;
        isActive: boolean;
      }>;
    };
    businessInfo?: {
      businessName?: string;
      businessAddress?: string;
      businessPhone?: string;
      businessEmail?: string;
    };
    services?: Array<{
      id?: string;
      name: string;
      description?: string;
      duration: number;
      price: number;
      isActive?: boolean;
    }>;
    currency?: string;
  };
  subscription: {
    plan: 'free' | 'basic' | 'premium';
    limits: {
      maxResources: number; // -1 means unlimited
      maxAppointmentsPerMonth: number; // -1 means unlimited
      maxUsers: number; // -1 means unlimited
    };
    trial?: {
      isActive: boolean;
      startDate: string;
      endDate: string;
      daysTotal: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export const createOrganization = async (
  orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Organization> => {
  const organization: Organization = {
    id: uuidv4(),
    ...orgData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const item = {
    PK: `ORG#${organization.id}`,
    SK: 'PROFILE',
    ...organization,
  };

  await putItem(TABLES.ORGANIZATIONS, item);
  return organization;
};

export const getOrganizationById = async (orgId: string): Promise<Organization | null> => {
  const item = await getItem(TABLES.ORGANIZATIONS, {
    PK: `ORG#${orgId}`,
    SK: 'PROFILE',
  });

  if (!item) return null;

  const { PK, SK, ...organization } = item;
  return organization as Organization;
};

export const updateOrganization = async (orgId: string, updates: Partial<Organization>): Promise<Organization> => {
  // Get current organization to merge settings properly
  const currentOrg = await getOrganizationById(orgId);
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

  await putItem(TABLES.ORGANIZATIONS, item);
  
  // Return the updated organization
  const { PK, SK, ...organization } = item;
  return organization as Organization;
};

export const getDefaultOrganizationSettings = (templateType: 'beauty_salon' | 'hyperbaric_center' | 'medical_clinic' | 'fitness_center' | 'consultant' | 'custom') => {
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
      plan: 'free' as const,
      limits: PLAN_LIMITS.free,
    },
  };
};
