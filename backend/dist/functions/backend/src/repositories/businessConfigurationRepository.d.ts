import { BusinessConfiguration } from '../../../shared/types/business';
export declare const createBusinessConfiguration: (configData: Omit<BusinessConfiguration, "id" | "createdAt" | "updatedAt">) => Promise<BusinessConfiguration>;
export declare const getBusinessConfigurationById: (orgId: string, configId: string) => Promise<BusinessConfiguration | null>;
export declare const getBusinessConfigurationByOrgId: (orgId: string) => Promise<BusinessConfiguration | null>;
export declare const updateBusinessConfiguration: (orgId: string, configId: string, updates: Partial<BusinessConfiguration>) => Promise<BusinessConfiguration>;
export declare const getDefaultBusinessConfiguration: (orgId: string, industryType: BusinessConfiguration["industryType"]) => Omit<BusinessConfiguration, "id" | "createdAt" | "updatedAt">;
