"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeOnboardingHandlers = void 0;
const onboardingEvents_1 = require("../events/onboardingEvents");
const organizationRepository_1 = require("../repositories/organizationRepository");
const businessConfigurationRepository_1 = require("../repositories/businessConfigurationRepository");
/**
 * Handler para sincronizar datos de Step 2: Organization Setup
 */
const handleOrganizationSetup = async (event) => {
    if (event.stepNumber !== 2)
        return;
    const { stepData, orgId } = event;
    try {
        const organizationUpdates = {
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
                },
                notifications: {}
            }
        };
        await (0, organizationRepository_1.updateOrganization)(orgId, organizationUpdates);
        console.log(`✅ Organization updated for step 2 - User: ${event.userId}`);
    }
    catch (error) {
        console.error(`❌ Failed to update organization for step 2:`, error);
    }
};
/**
 * Handler para sincronizar datos de Step 3: Business Configuration
 */
const handleBusinessConfiguration = async (event) => {
    if (event.stepNumber !== 3)
        return;
    const { stepData, orgId, userId } = event;
    try {
        // Obtener el tipo de industria del usuario (deberías almacenarlo en step 1)
        const industryType = 'custom'; // Por ahora default, pero deberías obtenerlo del step 1
        await (0, businessConfigurationRepository_1.createBusinessConfiguration)({
            orgId,
            industryType: industryType,
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
        console.log(`✅ Business configuration created for step 3 - User: ${userId}`);
    }
    catch (error) {
        console.error(`❌ Failed to create business configuration for step 3:`, error);
    }
};
/**
 * Handler para sincronizar datos de Step 4: Services Setup
 */
const handleServicesSetup = async (event) => {
    if (event.stepNumber !== 4)
        return;
    const { stepData, orgId, userId } = event;
    try {
        if (stepData.services && Array.isArray(stepData.services)) {
            // Actualizar organización con los servicios
            await (0, organizationRepository_1.updateOrganization)(orgId, {
                settings: {
                    services: stepData.services.map((service) => ({
                        ...service,
                        id: service.id || `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        isActive: service.isActive !== undefined ? service.isActive : true
                    }))
                }
            });
            console.log(`✅ Services updated for step 4 - User: ${userId}, Services: ${stepData.services.length}`);
        }
    }
    catch (error) {
        console.error(`❌ Failed to update services for step 4:`, error);
    }
};
/**
 * Handler para sincronizar datos de Step 5: Plan Selection
 */
const handlePlanSelection = async (event) => {
    if (event.stepNumber !== 5)
        return;
    const { stepData, orgId, userId } = event;
    try {
        const planLimits = getPlanLimits(stepData.planId);
        await (0, organizationRepository_1.updateOrganization)(orgId, {
            subscription: {
                plan: planLimits.plan,
                limits: planLimits.limits
            }
        });
        console.log(`✅ Plan updated for step 5 - User: ${userId}, Plan: ${stepData.planId}`);
    }
    catch (error) {
        console.error(`❌ Failed to update plan for step 5:`, error);
    }
};
/**
 * Handler para sincronización completa al finalizar onboarding
 */
const handleOnboardingCompleted = async (event) => {
    const { userId, orgId, onboardingData } = event;
    try {
        console.log(`🎉 Onboarding completed for User: ${userId}, Organization: ${orgId}`);
        // Aquí puedes agregar lógica adicional para cuando se complete el onboarding
        // Como enviar emails de bienvenida, inicializar datos por defecto, etc.
        // Por ejemplo, crear recursos por defecto basados en el tipo de industria
        // await createDefaultResources(orgId, industryType);
        console.log(`✅ Post-onboarding setup completed for User: ${userId}`);
    }
    catch (error) {
        console.error(`❌ Failed to complete post-onboarding setup:`, error);
    }
};
// Función utilitaria para obtener límites del plan
const getPlanLimits = (planId) => {
    switch (planId) {
        case 'basic':
            return {
                plan: 'free',
                limits: {
                    maxResources: 1,
                    maxAppointmentsPerMonth: 100,
                    maxUsers: 3
                }
            };
        case 'professional':
            return {
                plan: 'premium',
                limits: {
                    maxResources: 5,
                    maxAppointmentsPerMonth: 1000,
                    maxUsers: 10
                }
            };
        case 'enterprise':
            return {
                plan: 'premium',
                limits: {
                    maxResources: -1, // unlimited
                    maxAppointmentsPerMonth: -1, // unlimited
                    maxUsers: -1 // unlimited
                }
            };
        default:
            return {
                plan: 'free',
                limits: {
                    maxResources: 1,
                    maxAppointmentsPerMonth: 100,
                    maxUsers: 3
                }
            };
    }
};
/**
 * Inicializar todos los event listeners
 */
const initializeOnboardingHandlers = () => {
    // Registrar handlers para cada step
    onboardingEvents_1.onboardingEventEmitter.on(onboardingEvents_1.OnboardingEventEmitter.STEP_COMPLETED, handleOrganizationSetup);
    onboardingEvents_1.onboardingEventEmitter.on(onboardingEvents_1.OnboardingEventEmitter.STEP_COMPLETED, handleBusinessConfiguration);
    onboardingEvents_1.onboardingEventEmitter.on(onboardingEvents_1.OnboardingEventEmitter.STEP_COMPLETED, handleServicesSetup);
    onboardingEvents_1.onboardingEventEmitter.on(onboardingEvents_1.OnboardingEventEmitter.STEP_COMPLETED, handlePlanSelection);
    // Handler para onboarding completado
    onboardingEvents_1.onboardingEventEmitter.on(onboardingEvents_1.OnboardingEventEmitter.ONBOARDING_COMPLETED, handleOnboardingCompleted);
    console.log('🎯 Onboarding data handlers initialized');
};
exports.initializeOnboardingHandlers = initializeOnboardingHandlers;
