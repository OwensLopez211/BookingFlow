export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }
  
  export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }
  
  export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
  
  export interface Organization extends BaseEntity {
    name: string;
    templateType: 'beauty_salon' | 'hyperbaric_center';
    settings: {
      timezone: string;
      businessHours: BusinessHours;
      notifications: NotificationSettings;
    };
    subscription: {
      plan: 'free' | 'basic' | 'premium';
      limits: ResourceLimits;
    };
  }
  
  export interface BusinessHours {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  }
  
  export interface DaySchedule {
    isOpen: boolean;
    openTime: string; // "09:00"
    closeTime: string; // "18:00"
    breaks?: {
      startTime: string;
      endTime: string;
    }[];
  }
  
  export interface NotificationSettings {
    emailReminders: boolean;
    smsReminders: boolean;
    autoConfirmation: boolean;
    reminderHours: number; // 24 horas antes por defecto
  }
  
  export interface ResourceLimits {
    maxResources: number;
    maxAppointmentsPerMonth: number;
    maxUsers: number;
  }

  export const PLAN_LIMITS: Record<'free' | 'basic' | 'premium', ResourceLimits> = {
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

  export function getPlanLimits(plan: 'free' | 'basic' | 'premium'): ResourceLimits {
    return PLAN_LIMITS[plan];
  }