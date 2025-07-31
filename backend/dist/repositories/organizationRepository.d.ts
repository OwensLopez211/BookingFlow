export interface Organization {
    id: string;
    name: string;
    templateType: 'beauty_salon' | 'hyperbaric_center';
    settings: {
        timezone: string;
        businessHours: any;
        notifications: any;
    };
    subscription: {
        plan: 'free' | 'premium';
        limits: {
            maxResources: number;
            maxAppointmentsPerMonth: number;
            maxUsers: number;
        };
    };
    createdAt: string;
    updatedAt: string;
}
export declare const createOrganization: (orgData: Omit<Organization, "id" | "createdAt" | "updatedAt">) => Promise<Organization>;
export declare const getOrganizationById: (orgId: string) => Promise<Organization | null>;
export declare const updateOrganization: (orgId: string, updates: Partial<Organization>) => Promise<Organization>;
export declare const getDefaultOrganizationSettings: (templateType: "beauty_salon" | "hyperbaric_center") => {
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
