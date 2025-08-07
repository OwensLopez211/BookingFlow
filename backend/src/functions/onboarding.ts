import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { corsHeaders, createResponse } from '../utils/response';
import { verifyToken } from '../utils/cognito';
import { getUserByCognitoId, updateUserOnboarding } from '../repositories/userRepository';
import { createBusinessConfiguration } from '../repositories/businessConfigurationRepository';
import { updateOrganization } from '../repositories/organizationRepository';
import { onboardingEventEmitter } from '../events/onboardingEvents';
import { initializeOnboardingHandlers } from '../handlers/onboardingDataHandlers';

export const getOnboardingStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return createResponse(401, { error: 'Token is required' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return createResponse(401, { error: 'Invalid token' });
    }

    const user = await getUserByCognitoId(decoded.username);
    if (!user) {
      return createResponse(404, { error: 'User not found' });
    }

    return createResponse(200, {
      onboardingStatus: user.onboardingStatus || {
        isCompleted: false,
        currentStep: 1,
        completedSteps: [],
        startedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const updateOnboardingStep = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return createResponse(401, { error: 'Token is required' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return createResponse(401, { error: 'Invalid token' });
    }

    const user = await getUserByCognitoId(decoded.username);
    if (!user) {
      return createResponse(404, { error: 'User not found' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const { stepNumber, stepData } = JSON.parse(event.body);

    console.log(`=== ONBOARDING UPDATE REQUEST ===`);
    console.log(`Step: ${stepNumber}`);
    console.log(`Data:`, JSON.stringify(stepData, null, 2));
    console.log(`User ID: ${user.id}`);

    if (!stepNumber || !stepData) {
      console.log(`❌ Missing required fields: stepNumber=${stepNumber}, stepData=${!!stepData}`);
      return createResponse(400, { error: 'stepNumber and stepData are required' });
    }

    if (stepNumber < 1 || stepNumber > 5) {
      console.log(`❌ Invalid step number: ${stepNumber}`);
      return createResponse(400, { error: 'stepNumber must be between 1 and 5' });
    }

    // Validate step data based on step number
    console.log(`🔍 Validating step ${stepNumber} data...`);
    const validationResult = validateStepData(stepNumber, stepData);
    if (!validationResult.isValid) {
      console.log(`❌ Validation failed: ${validationResult.error}`);
      return createResponse(400, { error: validationResult.error });
    }
    console.log(`✅ Validation passed for step ${stepNumber}`);

    // Initialize event handlers (solo la primera vez)
    initializeOnboardingHandlers();

    // Update user onboarding status
    const updatedUser = await updateUserOnboarding(user.id, stepNumber, stepData);
    if (!updatedUser) {
      return createResponse(500, { error: 'Failed to update onboarding status' });
    }

    // Emit event for step completion to trigger automatic data synchronization
    if (user.orgId) {
      onboardingEventEmitter.emitStepCompleted({
        userId: user.id,
        orgId: user.orgId,
        stepNumber,
        stepData,
        timestamp: new Date().toISOString()
      });

      // If onboarding is completed, emit completion event
      if (updatedUser.onboardingStatus?.isCompleted) {
        onboardingEventEmitter.emitOnboardingCompleted({
          userId: user.id,
          orgId: user.orgId,
          onboardingData: {
            completedSteps: updatedUser.onboardingStatus.completedSteps || []
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    return createResponse(200, {
      message: 'Onboarding step updated successfully',
      onboardingStatus: updatedUser.onboardingStatus
    });

  } catch (error) {
    console.error('Error updating onboarding step:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

const validateStepData = (stepNumber: number, stepData: any): { isValid: boolean; error?: string } => {
  switch (stepNumber) {
    case 1: // Industry Selection
      if (!stepData.industryType) {
        return { isValid: false, error: 'industryType is required for step 1' };
      }
      const validIndustries = ['beauty_salon', 'medical_clinic', 'hyperbaric_center', 'fitness_center', 'consultant', 'custom'];
      if (!validIndustries.includes(stepData.industryType)) {
        return { isValid: false, error: 'Invalid industryType' };
      }
      if (stepData.industryType === 'custom' && !stepData.customIndustryName) {
        return { isValid: false, error: 'customIndustryName is required when industryType is custom' };
      }
      break;

    case 2: // Organization Setup
      const requiredFields = ['businessName', 'timezone', 'currency'];
      for (const field of requiredFields) {
        if (!stepData[field]) {
          return { isValid: false, error: `${field} is required for step 2` };
        }
      }
      break;

    case 3: // Business Configuration
      const requiredConfigFields = ['appointmentModel', 'allowClientSelection', 'bufferBetweenAppointments', 'maxAdvanceBookingDays'];
      for (const field of requiredConfigFields) {
        if (stepData[field] === undefined || stepData[field] === null) {
          return { isValid: false, error: `${field} is required for step 3` };
        }
      }
      const validModels = ['professional_based', 'resource_based', 'hybrid'];
      if (!validModels.includes(stepData.appointmentModel)) {
        return { isValid: false, error: 'Invalid appointmentModel' };
      }
      break;

    case 4: // Services Setup
      if (!stepData.services || !Array.isArray(stepData.services)) {
        return { isValid: false, error: 'services array is required for step 4' };
      }
      // Validate each service has required fields
      for (const service of stepData.services) {
        if (!service.name || !service.duration || service.price === undefined) {
          return { isValid: false, error: 'Each service must have name, duration, and price' };
        }
      }
      break;

    case 5: // Plan Selection
      if (!stepData.planId) {
        return { isValid: false, error: 'planId is required for step 5' };
      }
      const validPlans = ['basic', 'professional', 'enterprise'];
      if (!validPlans.includes(stepData.planId)) {
        return { isValid: false, error: 'Invalid planId. Valid plans are: ' + validPlans.join(', ') };
      }
      // Allow all plans now that we have proper implementation
      console.log(`Plan validation passed for: ${stepData.planId}`);
      break;

    default:
      return { isValid: false, error: 'Invalid step number' };
  }

  return { isValid: true };
};

const getPlanLimits = (planId: string) => {
  switch (planId) {
    case 'basic':
      return {
        plan: 'premium' as const,
        limits: {
          maxResources: 5,
          maxAppointmentsPerMonth: 1000,
          maxUsers: 2
        }
      };
    case 'professional':
      return {
        plan: 'premium' as const,
        limits: {
          maxResources: 10,
          maxAppointmentsPerMonth: 2500,
          maxUsers: 5
        }
      };
    case 'enterprise':
      return {
        plan: 'premium' as const,
        limits: {
          maxResources: -1, // unlimited
          maxAppointmentsPerMonth: -1, // unlimited
          maxUsers: -1 // unlimited
        }
      };
    default:
      // Default to basic plan
      return {
        plan: 'premium' as const,
        limits: {
          maxResources: 5,
          maxAppointmentsPerMonth: 1000,
          maxUsers: 2
        }
      };
  }
};

const syncOnboardingDataToOrganization = async (user: any) => {
  if (!user.orgId || !user.onboardingStatus?.completedSteps) {
    return;
  }

  const organizationUpdates: any = {
    settings: {}
  };

  // Process all completed steps to build organization settings
  for (const step of user.onboardingStatus.completedSteps) {
    switch (step.stepNumber) {
      case 2: // Organization Setup
        if (step.data) {
          organizationUpdates.name = step.data.businessName;
          organizationUpdates.address = step.data.businessAddress;
          organizationUpdates.phone = step.data.businessPhone;
          organizationUpdates.email = step.data.businessEmail;
          organizationUpdates.currency = step.data.currency;
          organizationUpdates.settings.timezone = step.data.timezone;
          
          // Properly map businessHours from onboarding to organization format
          if (step.data.businessHours) {
            organizationUpdates.settings.businessHours = step.data.businessHours;
          }
        }
        break;
      
      case 3: // Business Configuration  
        if (step.data) {
          // Store business configuration settings in organization
          organizationUpdates.settings.businessConfiguration = {
            appointmentModel: step.data.appointmentModel,
            allowClientSelection: step.data.allowClientSelection,
            bufferBetweenAppointments: step.data.bufferBetweenAppointments,
            maxAdvanceBookingDays: step.data.maxAdvanceBookingDays
          };
        }
        break;

      case 4: // Services Setup
        if (step.data && step.data.services) {
          // Store services configuration
          organizationUpdates.settings.services = step.data.services;
        }
        break;

      case 5: // Plan Selection
        if (step.data && step.data.planId) {
          // Update subscription plan using centralized logic
          const planLimits = getPlanLimits(step.data.planId);
          organizationUpdates.subscription = {
            plan: planLimits.plan,
            limits: planLimits.limits
          };
          
          // Add trial information for basic plan
          if (step.data.planId === 'basic') {
            const now = new Date();
            const trialDays = step.data.trialDays || 30;
            const endDate = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000));
            
            organizationUpdates.subscription.trial = {
              isActive: true,
              startDate: now.toISOString(),
              endDate: endDate.toISOString(),
              daysTotal: trialDays
            };
          }
        }
        break;
    }
  }

  // Update organization with all accumulated data
  if (Object.keys(organizationUpdates).length > 0) {
    await updateOrganization(user.orgId, organizationUpdates);
  }
};

const handleStepSpecificLogic = async (user: any, stepNumber: number, stepData: any) => {
  switch (stepNumber) {
    case 2: // Update organization with business details
      if (user.orgId) {
        await updateOrganization(user.orgId, {
          name: stepData.businessName,
          address: stepData.businessAddress,
          phone: stepData.businessPhone,
          email: stepData.businessEmail,
          currency: stepData.currency,
          settings: {
            timezone: stepData.timezone,
            businessHours: stepData.businessHours || {
              monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
              tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
              wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
              thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
              friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
              saturday: { isOpen: true, openTime: '09:00', closeTime: '14:00' },
              sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' }
            }
          }
        });
      }
      break;

    case 3: // Create business configuration
      if (user.orgId) {
        const industryType = user.onboardingStatus?.industry || 'custom';
        await createBusinessConfiguration({
          orgId: user.orgId,
          industryType: industryType as any,
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
      break;

    case 4: // Services Setup
      if (user.orgId && stepData.services) {
        // Services will be handled by syncOnboardingDataToOrganization for completed onboarding
        console.log(`User ${user.id} configured ${stepData.services.length} services`);
      }
      break;

    case 5: // Plan Selection
      if (user.orgId) {
        // Update organization subscription immediately when user selects plan
        const planLimits = getPlanLimits(stepData.planId);
        await updateOrganization(user.orgId, {
          subscription: {
            plan: planLimits.plan,
            limits: planLimits.limits
          }
        });
        console.log(`User ${user.id} selected plan: ${stepData.planId} - Organization subscription updated`);
        
        // Start free trial for basic plan
        if (stepData.planId === 'basic') {
          try {
            const now = new Date();
            const trialDays = stepData.trialDays || 30;
            const endDate = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000));
            
            console.log(`🎯 ONBOARDING STEP 5: Starting trial for ${user.orgId}`);
            console.log(`📅 Trial start: ${now.toISOString()}`);
            console.log(`📅 Trial end: ${endDate.toISOString()}`);
            console.log(`📊 Trial days: ${trialDays}`);
            
            // Update organization with trial information
            await updateOrganization(user.orgId, {
              subscription: {
                plan: planLimits.plan,
                limits: planLimits.limits,
                trial: {
                  isActive: true,
                  startDate: now.toISOString(),
                  endDate: endDate.toISOString(),
                  daysTotal: trialDays
                }
              }
            });
            
            console.log(`✅ Free trial started for organization ${user.orgId} - ${trialDays} days until ${endDate.toISOString()}`);
          } catch (error) {
            console.error('❌ Error starting free trial:', error);
            // Don't fail the onboarding if trial creation fails
          }
        }
      }
      break;
  }
};

export const syncOnboardingToOrganization = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return createResponse(401, { error: 'Token is required' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return createResponse(401, { error: 'Invalid token' });
    }

    const user = await getUserByCognitoId(decoded.username);
    if (!user) {
      return createResponse(404, { error: 'User not found' });
    }

    if (!user.orgId) {
      return createResponse(400, { error: 'User is not associated with an organization' });
    }

    if (!user.onboardingStatus?.isCompleted) {
      return createResponse(400, { error: 'Onboarding must be completed first' });
    }

    // Force synchronization of onboarding data to organization
    await syncOnboardingDataToOrganization(user);

    return createResponse(200, {
      message: 'Onboarding data synchronized successfully with organization settings'
    });

  } catch (error) {
    console.error('Error syncing onboarding to organization:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const resetOnboarding = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return createResponse(401, { error: 'Token is required' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return createResponse(401, { error: 'Invalid token' });
    }

    const user = await getUserByCognitoId(decoded.username);
    if (!user) {
      return createResponse(404, { error: 'User not found' });
    }

    // Only allow reset if user is owner
    if (user.role !== 'owner') {
      return createResponse(403, { error: 'Only owners can reset onboarding' });
    }

    // Reset onboarding manually by creating a new status
    const resetOnboardingStatus = {
      isCompleted: false,
      currentStep: 1,
      completedSteps: [],
      startedAt: new Date().toISOString(),
    };

    // Update user with reset status (we need to implement this)
    const updatedUser = {
      ...user,
      onboardingStatus: resetOnboardingStatus,
      updatedAt: new Date().toISOString(),
    };

    // Save the updated user
    const item = {
      PK: `USER#${user.id}`,
      SK: 'PROFILE',
      ...updatedUser,
    };

    const { putItem, TABLES } = await import('../utils/dynamodb');
    await putItem(TABLES.USERS, item);
    
    return createResponse(200, {
      message: 'Onboarding reset successfully',
      onboardingStatus: resetOnboardingStatus
    });

  } catch (error) {
    console.error('Error resetting onboarding:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};