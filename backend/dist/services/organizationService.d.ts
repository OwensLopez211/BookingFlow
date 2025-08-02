export interface CreateOrganizationData {
    name: string;
    templateType: 'beauty_salon' | 'hyperbaric_center';
    ownerId: string;
}
export interface UpdateOrganizationData {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    currency?: string;
    settings?: {
        timezone?: string;
        businessHours?: Record<string, {
            isOpen: boolean;
            openTime: string;
            closeTime: string;
        }>;
        notifications?: {
            emailReminders?: boolean;
            smsReminders?: boolean;
            autoConfirmation?: boolean;
            reminderHours?: number;
        };
        appointmentSystem?: {
            appointmentModel?: 'professional_based' | 'resource_based' | 'hybrid';
            allowClientSelection?: boolean;
            bufferBetweenAppointments?: number;
            maxAdvanceBookingDays?: number;
            maxProfessionals?: number;
            maxResources?: number;
            professionals?: Array<{
                id: string;
                name: string;
                photo?: string;
                isActive: boolean;
            }>;
        };
        businessConfiguration?: {
            appointmentModel?: 'professional_based' | 'resource_based' | 'hybrid';
            allowClientSelection?: boolean;
            bufferBetweenAppointments?: number;
            maxAdvanceBookingDays?: number;
            maxProfessionals?: number;
            maxResources?: number;
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
}
export declare const createOrganizationService: (data: CreateOrganizationData) => Promise<{
    success: boolean;
    organization: {
        id: string;
        name: string;
        templateType: "beauty_salon" | "hyperbaric_center" | "medical_clinic" | "fitness_center" | "consultant" | "custom";
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
            plan: "free" | "basic" | "premium";
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
    };
    message: string;
}>;
export declare const getOrganizationService: (orgId: string, userId: string) => Promise<{
    success: boolean;
    organization: {
        id: string;
        name: string;
        templateType: "beauty_salon" | "hyperbaric_center" | "medical_clinic" | "fitness_center" | "consultant" | "custom";
        address: string | undefined;
        phone: string | undefined;
        email: string | undefined;
        currency: string | undefined;
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
            plan: "free" | "basic" | "premium";
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
    };
}>;
export declare const updateOrganizationService: (orgId: string, userId: string, updates: UpdateOrganizationData) => Promise<{
    success: boolean;
    organization: {
        id: string;
        name: string;
        templateType: "beauty_salon" | "hyperbaric_center" | "medical_clinic" | "fitness_center" | "consultant" | "custom";
        address: string | undefined;
        phone: string | undefined;
        email: string | undefined;
        currency: string | undefined;
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
            plan: "free" | "basic" | "premium";
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
    };
    message: string;
}>;
export declare const getOrganizationTemplatesService: () => Promise<{
    success: boolean;
    templates: {
        id: string;
        name: string;
        description: string;
        features: string[];
        defaultSettings: {
            settings: {
                timezone: string;
                businessHours: {
                    monday: {
                        isOpen: boolean;
                        openTime: string;
                        closeTime: string;
                    };
                    tuesday: {
                        isOpen: boolean;
                        openTime: string;
                        closeTime: string;
                    };
                    wednesday: {
                        isOpen: boolean;
                        openTime: string;
                        closeTime: string;
                    };
                    thursday: {
                        isOpen: boolean;
                        openTime: string;
                        closeTime: string;
                    };
                    friday: {
                        isOpen: boolean;
                        openTime: string;
                        closeTime: string;
                    };
                    saturday: {
                        isOpen: boolean;
                        openTime: string;
                        closeTime: string;
                    };
                    sunday: {
                        isOpen: boolean;
                        openTime: string;
                        closeTime: string;
                    };
                };
                notifications: {
                    emailReminders: boolean;
                    smsReminders: boolean;
                    autoConfirmation: boolean;
                    reminderHours: number;
                };
            };
            subscription: {
                plan: "free";
                limits: {
                    maxResources: number;
                    maxAppointmentsPerMonth: number;
                    maxUsers: number;
                };
            };
        };
    }[];
    message: string;
}>;
