export interface Organization {
  id: string;
  name: string;
  templateType: 'beauty_salon' | 'hyperbaric_center' | 'medical_clinic' | 'fitness_center' | 'consultant' | 'custom';
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  settings: OrganizationSettings;
  subscription: {
    plan: 'free' | 'basic' | 'premium';
    limits: {
      maxResources: number;
      maxAppointmentsPerMonth: number;
      maxUsers: number;
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

export interface OrganizationSettings {
  timezone?: string;
  businessHours?: BusinessHours;
  notifications?: NotificationSettings;
  appointmentSystem?: AppointmentSystemSettings;
  businessConfiguration?: BusinessConfiguration;
  businessInfo?: BusinessInfo;
  services?: Service[];
  currency?: string;
}

export interface BusinessConfiguration {
  appointmentModel: 'professional_based' | 'resource_based' | 'hybrid';
  allowClientSelection: boolean;
  bufferBetweenAppointments: number;
  maxAdvanceBookingDays: number;
  maxProfessionals?: number; // Para professional_based
  maxResources?: number;     // Para resource_based
  professionals?: Professional[]; // Lista de profesionales
}

export interface Service {
  id?: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  isActive?: boolean;
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
  openTime: string;
  closeTime: string;
}

export interface NotificationSettings {
  emailReminders: boolean;
  smsReminders: boolean;
  autoConfirmation: boolean;
  reminderHours: number;
}

export interface Professional {
  id: string;
  name: string;
  photo?: string; // Base64 o URL de la foto
  isActive: boolean;
}

export interface AppointmentSystemSettings {
  appointmentModel: 'professional_based' | 'resource_based' | 'hybrid';
  allowClientSelection: boolean;
  bufferBetweenAppointments: number;
  maxAdvanceBookingDays: number;
  maxProfessionals?: number; // Para professional_based
  maxResources?: number;     // Para resource_based
  professionals?: Professional[]; // Lista de profesionales
}

export interface BusinessInfo {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
}

export interface UpdateOrganizationSettingsRequest {
  // Datos básicos de la organización
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  // Settings específicos
  timezone?: string;
  businessHours?: Partial<BusinessHours>;
  notifications?: Partial<NotificationSettings>;
  appointmentSystem?: Partial<AppointmentSystemSettings>;
  businessInfo?: Partial<BusinessInfo>;
  services?: Service[];
}