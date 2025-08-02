"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompatibilityReport = exports.validateMigration = exports.migrateAllOrganizations = exports.migrateOrganizationToFlexibleSystem = void 0;
const organizationRepo = __importStar(require("../repositories/organizationRepository"));
const businessConfigRepo = __importStar(require("../repositories/businessConfigurationRepository"));
const migrateOrganizationToFlexibleSystem = async (orgId) => {
    try {
        // Get existing organization
        const organization = await organizationRepo.getOrganizationById(orgId);
        if (!organization) {
            return {
                success: false,
                message: 'Organization not found',
            };
        }
        // Check if business configuration already exists
        const existingConfig = await businessConfigRepo.getBusinessConfigurationByOrgId(orgId);
        if (existingConfig) {
            return {
                success: false,
                message: 'Organization already migrated to flexible system',
                details: existingConfig,
            };
        }
        // Create business configuration based on existing template type
        const configData = businessConfigRepo.getDefaultBusinessConfiguration(orgId, organization.templateType);
        const businessConfig = await businessConfigRepo.createBusinessConfiguration(configData);
        return {
            success: true,
            message: 'Organization successfully migrated to flexible appointment system',
            details: {
                organizationId: orgId,
                businessConfigId: businessConfig.id,
                appointmentModel: businessConfig.appointmentModel,
                industryType: businessConfig.industryType,
            },
        };
    }
    catch (error) {
        console.error('Migration error:', error);
        return {
            success: false,
            message: `Migration failed: ${error.message}`,
        };
    }
};
exports.migrateOrganizationToFlexibleSystem = migrateOrganizationToFlexibleSystem;
const migrateAllOrganizations = async () => {
    // This function would typically scan all organizations and migrate them
    // For now, it's a placeholder that demonstrates the pattern
    const results = [];
    // In a real implementation, you would:
    // 1. Scan all organizations from DynamoDB
    // 2. Filter out already migrated ones
    // 3. Migrate each one individually
    // 4. Collect results
    console.log('Batch migration not implemented yet - use individual migration');
    return results;
};
exports.migrateAllOrganizations = migrateAllOrganizations;
const validateMigration = async (orgId) => {
    try {
        const organization = await organizationRepo.getOrganizationById(orgId);
        if (!organization) {
            return {
                success: false,
                message: 'Organization not found',
            };
        }
        const businessConfig = await businessConfigRepo.getBusinessConfigurationByOrgId(orgId);
        if (!businessConfig) {
            return {
                success: false,
                message: 'Organization has not been migrated to flexible system',
            };
        }
        // Validate configuration integrity
        const validationChecks = [
            {
                name: 'Business Configuration Exists',
                passed: !!businessConfig,
            },
            {
                name: 'Industry Type Matches',
                passed: isCompatibleIndustryType(organization.templateType, businessConfig.industryType),
            },
            {
                name: 'Appointment Model Valid',
                passed: ['professional_based', 'resource_based', 'hybrid'].includes(businessConfig.appointmentModel),
            },
            {
                name: 'Settings Structure Valid',
                passed: validateBusinessSettings(businessConfig.settings),
            },
        ];
        const allPassed = validationChecks.every(check => check.passed);
        return {
            success: allPassed,
            message: allPassed
                ? 'Migration validation successful'
                : 'Migration validation found issues',
            details: {
                organizationId: orgId,
                businessConfigId: businessConfig.id,
                checks: validationChecks,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Validation failed: ${error.message}`,
        };
    }
};
exports.validateMigration = validateMigration;
const getCompatibilityReport = async (orgId) => {
    const organization = await organizationRepo.getOrganizationById(orgId);
    const businessConfig = await businessConfigRepo.getBusinessConfigurationByOrgId(orgId);
    const isFlexibleSystem = !!businessConfig;
    const recommendedActions = [];
    if (!isFlexibleSystem) {
        recommendedActions.push('Migrate to flexible appointment system for enhanced features');
        recommendedActions.push('Create business configuration matching your industry type');
        if (organization?.templateType === 'beauty_salon') {
            recommendedActions.push('Set up staff management for professional-based appointments');
        }
        else if (organization?.templateType === 'hyperbaric_center') {
            recommendedActions.push('Configure resource management for equipment-based appointments');
        }
    }
    else {
        recommendedActions.push('System is up to date with flexible appointment management');
        if (businessConfig.appointmentModel === 'hybrid') {
            recommendedActions.push('Consider setting up both staff and resources for maximum flexibility');
        }
    }
    return {
        currentSystem: isFlexibleSystem ? 'flexible' : 'legacy',
        recommendedActions,
        migrationRequired: !isFlexibleSystem,
        backwardCompatible: true, // Current implementation maintains backward compatibility
    };
};
exports.getCompatibilityReport = getCompatibilityReport;
// Helper functions
const isCompatibleIndustryType = (templateType, industryType) => {
    const compatibilityMap = {
        'beauty_salon': ['beauty_salon', 'custom'],
        'hyperbaric_center': ['hyperbaric_center', 'medical_clinic', 'custom'],
        'medical_clinic': ['medical_clinic', 'custom'],
        'fitness_center': ['fitness_center', 'custom'],
        'consultant': ['consultant', 'custom'],
        'custom': ['custom'],
    };
    return compatibilityMap[templateType]?.includes(industryType) || false;
};
const validateBusinessSettings = (settings) => {
    const requiredFields = [
        'allowClientSelection',
        'requireResourceAssignment',
        'autoAssignResources',
        'bufferBetweenAppointments',
        'maxAdvanceBookingDays',
        'cancellationPolicy',
        'notificationSettings',
    ];
    return requiredFields.every(field => settings.hasOwnProperty(field));
};
