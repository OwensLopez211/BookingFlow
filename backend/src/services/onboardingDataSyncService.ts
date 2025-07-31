import { getUserByCognitoId } from '../repositories/userRepository';
import { updateOrganization, getOrganizationById } from '../repositories/organizationRepository';
import { createBusinessConfiguration, getBusinessConfigurationByOrgId } from '../repositories/businessConfigurationRepository';

export interface SyncResult {
  success: boolean;
  syncedModules: string[];
  errors: string[];
}

/**
 * Servicio para sincronización manual o verificación de datos
 */
export class OnboardingDataSyncService {
  
  /**
   * Sincroniza todos los datos del onboarding con los módulos correspondientes
   */
  static async syncAllOnboardingData(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedModules: [],
      errors: []
    };

    try {
      const user = await getUserByCognitoId(userId);
      if (!user || !user.orgId) {
        result.success = false;
        result.errors.push('User or organization not found');
        return result;
      }

      if (!user.onboardingStatus?.completedSteps) {
        result.success = false;
        result.errors.push('No completed onboarding steps found');
        return result;
      }

      // Procesar cada step completado
      for (const step of user.onboardingStatus.completedSteps) {
        try {
          await this.syncStepData(user.orgId, step.stepNumber, step.data, userId);
          result.syncedModules.push(`Step ${step.stepNumber}`);
        } catch (error) {
          result.errors.push(`Failed to sync step ${step.stepNumber}: ${error}`);
          result.success = false;
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`General sync error: ${error}`);
    }

    return result;
  }

  /**
   * Sincroniza datos de un step específico
   */
  static async syncStepData(orgId: string, stepNumber: number, stepData: any, userId: string) {
    switch (stepNumber) {
      case 1:
        await this.syncIndustryData(orgId, stepData);
        break;
      case 2:
        await this.syncOrganizationData(orgId, stepData);
        break;
      case 3:
        await this.syncBusinessConfiguration(orgId, stepData);
        break;
      case 4:
        await this.syncServicesData(orgId, stepData);
        break;
      case 5:
        await this.syncPlanData(orgId, stepData);
        break;
      default:
        throw new Error(`Unknown step number: ${stepNumber}`);
    }
  }

  /**
   * Verifica si los datos están sincronizados correctamente
   */
  static async verifyDataSync(userId: string): Promise<{
    isSynced: boolean;
    missingData: string[];
    inconsistencies: string[];
  }> {
    const user = await getUserByCognitoId(userId);
    if (!user || !user.orgId) {
      return {
        isSynced: false,
        missingData: ['User or organization not found'],
        inconsistencies: []
      };
    }

    const missingData: string[] = [];
    const inconsistencies: string[] = [];

    // Verificar que la organización existe y tiene los datos básicos
    const org = await getOrganizationById(user.orgId);
    if (!org) {
      missingData.push('Organization data missing');
    }

    // Verificar configuración de negocio
    const businessConfig = await getBusinessConfigurationByOrgId(user.orgId);
    if (!businessConfig) {
      missingData.push('Business configuration missing');
    }

    // Verificar datos específicos basados en los steps completados
    if (user.onboardingStatus?.completedSteps) {
      for (const step of user.onboardingStatus.completedSteps) {
        switch (step.stepNumber) {
          case 2:
            if (org && !org.name) {
              missingData.push('Organization name missing');
            }
            break;
          case 4:
            if (org && !org.settings?.services) {
              missingData.push('Services data missing');
            }
            break;
          case 5:
            if (org && !org.subscription) {
              missingData.push('Subscription data missing');
            }
            break;
        }
      }
    }

    return {
      isSynced: missingData.length === 0 && inconsistencies.length === 0,
      missingData,
      inconsistencies
    };
  }

  // Métodos privados para sincronización de cada step
  private static async syncIndustryData(orgId: string, stepData: any) {
    await updateOrganization(orgId, {
      templateType: stepData.industryType
    });
  }

  private static async syncOrganizationData(orgId: string, stepData: any) {
    await updateOrganization(orgId, {
      name: stepData.businessName,
      address: stepData.businessAddress,
      phone: stepData.businessPhone,
      email: stepData.businessEmail,
      currency: stepData.currency,
      settings: {
        timezone: stepData.timezone,
        businessHours: stepData.businessHours,
        notifications: {}
      }
    });
  }

  private static async syncBusinessConfiguration(orgId: string, stepData: any) {
    // Verificar si ya existe una configuración
    const existing = await getBusinessConfigurationByOrgId(orgId);
    
    if (!existing) {
      await createBusinessConfiguration({
        orgId,
        industryType: 'custom' as any, // Deberías obtener esto del step 1
        appointmentModel: stepData.appointmentModel,
        settings: {
          allowClientSelection: stepData.allowClientSelection,
          requireResourceAssignment: false,
          autoAssignResources: false,
          bufferBetweenAppointments: stepData.bufferBetweenAppointments,
          maxAdvanceBookingDays: stepData.maxAdvanceBookingDays,
          cancellationPolicy: {
            allowCancellation: true,
            hoursBeforeAppointment: 24,
            penaltyPercentage: 0,
          },
          notificationSettings: {
            sendReminders: true,
            reminderHours: [24, 2],
            requireConfirmation: false,
          },
        },
      });
    }
  }

  private static async syncServicesData(orgId: string, stepData: any) {
    if (stepData.services && Array.isArray(stepData.services)) {
      await updateOrganization(orgId, {
        settings: {
          services: stepData.services.map((service: any) => ({
            ...service,
            id: service.id || `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isActive: service.isActive !== undefined ? service.isActive : true
          }))
        }
      });
    }
  }

  private static async syncPlanData(orgId: string, stepData: any) {
    const planLimits = this.getPlanLimits(stepData.planId);
    
    await updateOrganization(orgId, {
      subscription: {
        plan: planLimits.plan,
        limits: planLimits.limits
      }
    });
  }

  private static getPlanLimits(planId: string) {
    switch (planId) {
      case 'basic':
        return {
          plan: 'free' as const,
          limits: { maxResources: 1, maxAppointmentsPerMonth: 100, maxUsers: 3 }
        };
      case 'professional':
        return {
          plan: 'premium' as const,
          limits: { maxResources: 5, maxAppointmentsPerMonth: 1000, maxUsers: 10 }
        };
      case 'enterprise':
        return {
          plan: 'premium' as const,
          limits: { maxResources: -1, maxAppointmentsPerMonth: -1, maxUsers: -1 }
        };
      default:
        return {
          plan: 'free' as const,
          limits: { maxResources: 1, maxAppointmentsPerMonth: 100, maxUsers: 3 }
        };
    }
  }
}