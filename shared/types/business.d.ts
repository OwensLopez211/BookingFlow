import { BaseEntity } from './common';
export interface Resource extends BaseEntity {
    orgId: string;
    type: 'professional' | 'equipment';
    name: string;
    description?: string;
    isActive: boolean;
    schedule: WeeklySchedule;
    settings: ResourceSettings;
    metadata?: Record<string, any>;
}
export interface WeeklySchedule {
    monday: ResourceDaySchedule;
    tuesday: ResourceDaySchedule;
    wednesday: ResourceDaySchedule;
    thursday: ResourceDaySchedule;
    friday: ResourceDaySchedule;
    saturday: ResourceDaySchedule;
    sunday: ResourceDaySchedule;
}
export interface ResourceDaySchedule {
    isAvailable: boolean;
    startTime: string;
    endTime: string;
    breaks?: {
        startTime: string;
        endTime: string;
    }[];
}
export interface ResourceSettings {
    bookingAdvanceDays: number;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    minSessionDuration: number;
    maxSessionDuration: number;
    allowOnlineBooking: boolean;
    requireConfirmation: boolean;
}
export interface Appointment extends BaseEntity {
    orgId: string;
    resourceId: string;
    clientInfo: ClientInfo;
    serviceInfo: ServiceInfo;
    datetime: string;
    duration: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    notes?: string;
    metadata?: Record<string, any>;
}
export interface ClientInfo {
    name: string;
    email: string;
    phone?: string;
    isReturningClient: boolean;
    clientId?: string;
}
export interface ServiceInfo {
    name: string;
    description?: string;
    price?: number;
    duration: number;
    category?: string;
}
export interface BeautySalonResource extends Resource {
    type: 'professional';
    settings: ResourceSettings & {
        specialties: string[];
        experienceLevel: 'junior' | 'senior' | 'expert';
        commission?: number;
    };
}
export interface HyperbaricCenterResource extends Resource {
    type: 'equipment';
    settings: ResourceSettings & {
        chamberType: 'monoplace' | 'multiplace';
        maxPressure: number;
        capacity: number;
        maintenanceSchedule?: {
            lastMaintenance: string;
            nextMaintenance: string;
        };
    };
}
