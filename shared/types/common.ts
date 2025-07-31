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
      plan: 'free' | 'premium';
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