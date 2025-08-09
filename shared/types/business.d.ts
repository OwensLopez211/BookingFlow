import { BaseEntity } from './common';
export interface BusinessConfiguration extends BaseEntity {
    orgId: string;
    industryType: 'beauty_salon' | 'medical_clinic' | 'hyperbaric_center' | 'fitness_center' | 'consultant' | 'custom';
    appointmentModel: 'professional_based' | 'resource_based' | 'hybrid';
    settings: BusinessSettings;
    customFields?: BusinessCustomField[];
}
export interface BusinessSettings {
    allowClientSelection: boolean;
    requireResourceAssignment: boolean;
    autoAssignResources: boolean;
    bufferBetweenAppointments: number;
    maxAdvanceBookingDays: number;
    cancellationPolicy: {
        allowCancellation: boolean;
        hoursBeforeAppointment: number;
        penaltyPercentage?: number;
    };
    notificationSettings: {
        sendReminders: boolean;
        reminderHours: number[];
        requireConfirmation: boolean;
    };
}
export interface BusinessCustomField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date' | 'time';
    required: boolean;
    options?: string[];
    applyTo: 'appointment' | 'client' | 'resource' | 'staff';
}
export interface Staff extends BaseEntity {
    orgId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    specialties: string[];
    isActive: boolean;
    schedule: WeeklySchedule;
    settings: StaffSettings;
    metadata?: Record<string, any>;
}
export interface StaffSettings {
    allowOnlineBooking: boolean;
    requireClientApproval: boolean;
    workingDays: string[];
    commissionRate?: number;
    hourlyRate?: number;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
}
export interface Resource extends BaseEntity {
    orgId: string;
    type: 'equipment' | 'room' | 'facility';
    name: string;
    description?: string;
    isActive: boolean;
    schedule: WeeklySchedule;
    settings: ResourceSettings;
    staffRequirements?: {
        requiredStaff: number;
        allowedRoles: string[];
    };
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
export interface Availability extends BaseEntity {
    orgId: string;
    entityType: 'staff' | 'resource';
    entityId: string;
    date: string;
    timeSlots: AvailabilitySlot[];
    isActive: boolean;
    override?: boolean;
}
export interface AvailabilitySlot {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    bookedAppointmentId?: string;
    reasonUnavailable?: string;
    customReason?: string;
}
export interface Appointment extends BaseEntity {
    orgId: string;
    staffId?: string;
    resourceId?: string;
    clientInfo?: ClientInfo;
    serviceInfo?: ServiceInfo;
    datetime: string;
    duration: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled';
    assignmentType?: 'staff_only' | 'resource_only' | 'staff_and_resource';
    notes?: string;
    customFields?: {
        [fieldId: string]: any;
    };
    cancellationInfo?: {
        cancelledAt: string;
        cancelledBy: string;
        reason?: string;
        penaltyApplied?: number;
    };
    reschedulingHistory?: ReschedulingRecord[];
    metadata?: Record<string, any>;
    serviceId?: string;
    professionalId?: string;
    time?: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    serviceName?: string;
    servicePrice?: number;
}
export interface ReschedulingRecord {
    previousDatetime: string;
    newDatetime: string;
    rescheduledAt: string;
    rescheduledBy: string;
    reason?: string;
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
