import { Organization } from '../repositories/organizationRepository';
import { BusinessConfiguration } from '../../../shared/types/business';
import * as organizationRepo from '../repositories/organizationRepository';
import * as businessConfigRepo from '../repositories/businessConfigurationRepository';

export interface MigrationResult {
  success: boolean;
  message: string;
  details?: any;
}

export const migrateOrganizationToFlexibleSystem = async (orgId: string): Promise<MigrationResult> => {
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
    const configData = businessConfigRepo.getDefaultBusinessConfiguration(
      orgId,
      organization.templateType as BusinessConfiguration['industryType']
    );

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
  } catch (error: any) {
    console.error('Migration error:', error);
    return {
      success: false,
      message: `Migration failed: ${error.message}`,
    };
  }
};

export const migrateAllOrganizations = async (): Promise<MigrationResult[]> => {
  // This function would typically scan all organizations and migrate them
  // For now, it's a placeholder that demonstrates the pattern
  
  const results: MigrationResult[] = [];
  
  // In a real implementation, you would:
  // 1. Scan all organizations from DynamoDB
  // 2. Filter out already migrated ones
  // 3. Migrate each one individually
  // 4. Collect results
  
  console.log('Batch migration not implemented yet - use individual migration');
  
  return results;
};

export const validateMigration = async (orgId: string): Promise<MigrationResult> => {
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
  } catch (error: any) {
    return {
      success: false,
      message: `Validation failed: ${error.message}`,
    };
  }
};

export const getCompatibilityReport = async (orgId: string): Promise<{
  currentSystem: 'legacy' | 'flexible';
  recommendedActions: string[];
  migrationRequired: boolean;
  backwardCompatible: boolean;
}> => {
  const organization = await organizationRepo.getOrganizationById(orgId);
  const businessConfig = await businessConfigRepo.getBusinessConfigurationByOrgId(orgId);

  const isFlexibleSystem = !!businessConfig;
  const recommendedActions: string[] = [];

  if (!isFlexibleSystem) {
    recommendedActions.push('Migrate to flexible appointment system for enhanced features');
    recommendedActions.push('Create business configuration matching your industry type');
    
    if (organization?.templateType === 'beauty_salon') {
      recommendedActions.push('Set up staff management for professional-based appointments');
    } else if (organization?.templateType === 'hyperbaric_center') {
      recommendedActions.push('Configure resource management for equipment-based appointments');
    }
  } else {
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

// Helper functions
const isCompatibleIndustryType = (
  templateType: string, 
  industryType: BusinessConfiguration['industryType']
): boolean => {
  const compatibilityMap: Record<string, BusinessConfiguration['industryType'][]> = {
    'beauty_salon': ['beauty_salon', 'custom'],
    'hyperbaric_center': ['hyperbaric_center', 'medical_clinic', 'custom'],
    'medical_clinic': ['medical_clinic', 'custom'],
    'fitness_center': ['fitness_center', 'custom'],
    'consultant': ['consultant', 'custom'],
    'custom': ['custom'],
  };

  return compatibilityMap[templateType]?.includes(industryType) || false;
};

const validateBusinessSettings = (settings: any): boolean => {
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