export interface MigrationResult {
    success: boolean;
    message: string;
    details?: any;
}
export declare const migrateOrganizationToFlexibleSystem: (orgId: string) => Promise<MigrationResult>;
export declare const migrateAllOrganizations: () => Promise<MigrationResult[]>;
export declare const validateMigration: (orgId: string) => Promise<MigrationResult>;
export declare const getCompatibilityReport: (orgId: string) => Promise<{
    currentSystem: "legacy" | "flexible";
    recommendedActions: string[];
    migrationRequired: boolean;
    backwardCompatible: boolean;
}>;
