import { Availability, AvailabilitySlot } from '../../../shared/types/business';
export interface AvailabilityGenerationOptions {
    startDate: string;
    endDate: string;
    slotDuration: number;
    override?: boolean;
}
export interface AvailableSlotResult {
    entityType: 'staff' | 'resource';
    entityId: string;
    entityName: string;
    date: string;
    slots: AvailabilitySlot[];
}
export declare const generateAvailabilityForStaff: (orgId: string, staffId: string, options: AvailabilityGenerationOptions) => Promise<void>;
export declare const generateAvailabilityForResource: (orgId: string, resourceId: string, options: AvailabilityGenerationOptions) => Promise<void>;
export declare const generateAvailabilityForOrganization: (orgId: string, options: AvailabilityGenerationOptions) => Promise<void>;
export declare const findAvailableSlots: (orgId: string, date: string, duration: number, entityType?: "staff" | "resource", entityId?: string, requiredSpecialties?: string[]) => Promise<AvailableSlotResult[]>;
export declare const bookSlot: (orgId: string, entityType: "staff" | "resource", entityId: string, date: string, startTime: string, duration: number, appointmentId: string) => Promise<void>;
export declare const releaseSlot: (orgId: string, entityType: "staff" | "resource", entityId: string, date: string, appointmentId: string) => Promise<void>;
export declare const getEntityAvailability: (orgId: string, entityType: "staff" | "resource", entityId: string, startDate: string, endDate: string) => Promise<Availability[]>;
export declare const blockTimeSlot: (orgId: string, entityType: "staff" | "resource", entityId: string, date: string, startTime: string, endTime: string, reason: string, customReason?: string) => Promise<void>;
