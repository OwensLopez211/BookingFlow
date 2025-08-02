import { Appointment, ClientInfo, ServiceInfo } from '../../../shared/types/business';
export interface CreateAppointmentRequest {
    orgId: string;
    clientInfo: ClientInfo;
    serviceInfo: ServiceInfo;
    datetime: string;
    duration: number;
    preferredStaffId?: string;
    preferredResourceId?: string;
    customFields?: {
        [fieldId: string]: any;
    };
    notes?: string;
}
export interface AppointmentAssignment {
    staffId?: string;
    resourceId?: string;
    assignmentType: 'staff_only' | 'resource_only' | 'staff_and_resource';
}
export declare const createAppointment: (request: CreateAppointmentRequest) => Promise<Appointment>;
export declare const updateAppointment: (orgId: string, appointmentId: string, updates: Partial<Appointment>) => Promise<Appointment>;
export declare const cancelAppointment: (orgId: string, appointmentId: string, cancelledBy: "client" | "staff" | "admin", reason?: string) => Promise<Appointment>;
export declare const rescheduleAppointment: (orgId: string, appointmentId: string, newDatetime: string, rescheduledBy: string, reason?: string) => Promise<Appointment>;
export declare const getAppointmentsByDateRange: (orgId: string, startDate: string, endDate: string, staffId?: string, resourceId?: string) => Promise<Appointment[]>;
