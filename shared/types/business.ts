import { BaseEntity } from './common';

// Business Configuration for flexible industry models
export interface BusinessConfiguration extends BaseEntity {
  orgId: string;
  industryType: 'beauty_salon' | 'medical_clinic' | 'hyperbaric_center' | 'fitness_center' | 'consultant' | 'custom';
  appointmentModel: 'professional_based' | 'resource_based' | 'hybrid';
  settings: BusinessSettings;
  customFields?: BusinessCustomField[];
}

export interface BusinessSettings {
  allowClientSelection: boolean; // Can clients choose specific professional/resource
  requireResourceAssignment: boolean; // Must appointments have resource assigned
  autoAssignResources: boolean; // Auto-assign available resources
  bufferBetweenAppointments: number; // Minutes between appointments
  maxAdvanceBookingDays: number; // How far ahead can clients book
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
  options?: string[]; // For select/multiselect
  applyTo: 'appointment' | 'client' | 'resource' | 'staff';
}

// Staff Entity (for professionals in professional_based or hybrid models)
export interface Staff extends BaseEntity {
  orgId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string; // e.g., 'doctor', 'stylist', 'therapist', 'consultant'
  specialties: string[];
  isActive: boolean;
  schedule: WeeklySchedule;
  settings: StaffSettings;
  metadata?: Record<string, any>;
}

export interface StaffSettings {
  allowOnlineBooking: boolean;
  requireClientApproval: boolean;
  workingDays: string[]; // ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  commissionRate?: number; // Percentage for beauty salons
  hourlyRate?: number; // For consultants
  bufferTimeBefore: number;
  bufferTimeAfter: number;
}

// Resource Entity (for equipment, rooms, or facilities)
export interface Resource extends BaseEntity {
  orgId: string;
  type: 'equipment' | 'room' | 'facility';
  name: string;
  description?: string;
  isActive: boolean;
  schedule: WeeklySchedule;
  settings: ResourceSettings;
  staffRequirements?: {
    requiredStaff: number; // Minimum staff needed to operate
    allowedRoles: string[]; // Which staff roles can operate this resource
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
  bookingAdvanceDays: number; // Cuántos días de anticipación se puede reservar
  bufferTimeBefore: number; // Minutos de buffer antes de la cita
  bufferTimeAfter: number; // Minutos de buffer después de la cita
  minSessionDuration: number; // Duración mínima de sesión en minutos
  maxSessionDuration: number; // Duración máxima de sesión en minutos
  allowOnlineBooking: boolean;
  requireConfirmation: boolean;
}

// Availability Entity for complex time management
export interface Availability extends BaseEntity {
  orgId: string;
  entityType: 'staff' | 'resource';
  entityId: string;
  date: string; // YYYY-MM-DD format
  timeSlots: AvailabilitySlot[];
  isActive: boolean;
  override?: boolean; // Overrides regular schedule for this specific date
}

export interface AvailabilitySlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
  bookedAppointmentId?: string;
  reasonUnavailable?: string; // 'booked', 'break', 'maintenance', 'custom'
  customReason?: string;
}

// Updated Appointment Entity for flexible architecture
export interface Appointment extends BaseEntity {
  orgId: string;
  staffId?: string; // For professional_based or hybrid models
  resourceId?: string; // For resource_based or hybrid models
  clientInfo: ClientInfo;
  serviceInfo: ServiceInfo;
  datetime: string; // ISO string
  duration: number; // minutos
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled';
  assignmentType: 'staff_only' | 'resource_only' | 'staff_and_resource';
  notes?: string;
  customFields?: { [fieldId: string]: any };
  cancellationInfo?: {
    cancelledAt: string;
    cancelledBy: string; // 'client' | 'staff' | 'admin'
    reason?: string;
    penaltyApplied?: number;
  };
  reschedulingHistory?: ReschedulingRecord[];
  metadata?: Record<string, any>;
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
  clientId?: string; // Para clientes registrados
}

export interface ServiceInfo {
  name: string;
  description?: string;
  price?: number;
  duration: number; // minutos
  category?: string;
}

// Template específicos
export interface BeautySalonResource extends Resource {
  type: 'professional';
  settings: ResourceSettings & {
    specialties: string[];
    experienceLevel: 'junior' | 'senior' | 'expert';
    commission?: number; // Porcentaje de comisión
  };
}

export interface HyperbaricCenterResource extends Resource {
  type: 'equipment';
  settings: ResourceSettings & {
    chamberType: 'monoplace' | 'multiplace';
    maxPressure: number; // ATA
    capacity: number; // Número de personas
    maintenanceSchedule?: {
      lastMaintenance: string;
      nextMaintenance: string;
    };
  };
}