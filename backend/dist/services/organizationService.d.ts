export interface CreateOrganizationData {
    name: string;
    templateType: 'beauty_salon' | 'hyperbaric_center';
    ownerId: string;
}
export interface UpdateOrganizationData {
    name?: string;
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
    };
}
export declare const createOrganizationService: (data: CreateOrganizationData) => Promise<{
    success: boolean;
    organization: {
        id: string;
        name: string;
        templateType: "beauty_salon" | "hyperbaric_center";
        settings: {
            timezone: string;
            businessHours: any;
            notifications: any;
        };
        subscription: {
            plan: "free" | "premium";
            limits: {
                maxResources: number;
                maxAppointmentsPerMonth: number;
                maxUsers: number;
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
        templateType: "beauty_salon" | "hyperbaric_center";
        settings: {
            timezone: string;
            businessHours: any;
            notifications: any;
        };
        subscription: {
            plan: "free" | "premium";
            limits: {
                maxResources: number;
                maxAppointmentsPerMonth: number;
                maxUsers: number;
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
        templateType: "beauty_salon" | "hyperbaric_center";
        settings: {
            timezone: string;
            businessHours: any;
            notifications: any;
        };
        subscription: {
            plan: "free" | "premium";
            limits: {
                maxResources: number;
                maxAppointmentsPerMonth: number;
                maxUsers: number;
            };
        };
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
