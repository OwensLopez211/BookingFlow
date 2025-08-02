export interface SyncResult {
    success: boolean;
    syncedModules: string[];
    errors: string[];
}
/**
 * Servicio para sincronización manual o verificación de datos
 */
export declare class OnboardingDataSyncService {
    /**
     * Sincroniza todos los datos del onboarding con los módulos correspondientes
     */
    static syncAllOnboardingData(userId: string): Promise<SyncResult>;
    /**
     * Sincroniza datos de un step específico
     */
    static syncStepData(orgId: string, stepNumber: number, stepData: any, userId: string): Promise<void>;
    /**
     * Verifica si los datos están sincronizados correctamente
     */
    static verifyDataSync(userId: string): Promise<{
        isSynced: boolean;
        missingData: string[];
        inconsistencies: string[];
    }>;
    private static syncIndustryData;
    private static syncOrganizationData;
    private static syncBusinessConfiguration;
    private static syncServicesData;
    private static syncPlanData;
    private static getPlanLimits;
}
