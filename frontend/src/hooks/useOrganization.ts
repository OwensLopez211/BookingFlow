import { useState, useEffect, useCallback, useRef } from 'react';
import { Organization, UpdateOrganizationSettingsRequest } from '../../types/organization';
import { LoadingState } from '../../types/common';
import { organizationService } from '../services/organizationService';

export const useOrganization = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Para cancelar requests pendientes
  const abortControllerRef = useRef<AbortController | null>(null);

  // Función helper para manejar respuestas de la API
  const handleApiResponse = useCallback((
    result: { success: boolean; organization?: Organization; data?: { organization?: Organization }; error?: string }, 
    successMessage: string, 
    errorMessage: string
  ): boolean => {
    console.log('🔍 handleApiResponse ejecutándose...');
    console.log('📊 Evaluando condiciones:');
    console.log('  - result.success:', result.success);
    console.log('  - result.organization existe:', !!result.organization);
    console.log('  - result.data?.organization existe:', !!result.data?.organization);
    
    if (result.success && result.organization) {
      console.log('✅ Camino 1: result.organization encontrado');
      setOrganization(result.organization);
      setLoadingState('success');
      setError(null);
      return true;
    } else if (result.success && result.data?.organization) {
      console.log('✅ Camino 2: result.data.organization encontrado');
      setOrganization(result.data.organization);
      setLoadingState('success');
      setError(null);
      return true;
    } else {
      console.log('❌ Ningún camino válido encontrado');
      console.log('❌ Error a mostrar:', result.error || errorMessage);
      setError(result.error || errorMessage);
      setLoadingState('error');
      return false;
    }
  }, []);

  // Función helper para validar token
  const validateToken = useCallback((): boolean => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No hay token de acceso. Por favor, inicia sesión nuevamente.');
      setLoadingState('error');
      return false;
    }
    return true;
  }, []);

  const fetchOrganization = useCallback(async () => {
    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setLoadingState('loading');
    setError(null);

    if (!validateToken()) {
      return;
    }
    
    try {
      console.log('🔄 Llamando a organizationService.getMyOrganization()...');
      const result = await organizationService.getMyOrganization();
      console.log('📥 Resultado del service:', result);
      
      if (result.success || result.organization || result.data?.organization) {
        // Obtener datos adicionales del onboarding y configuración de negocio
        const [businessConfigResult, onboardingResult] = await Promise.allSettled([
          organizationService.getBusinessConfiguration(),
          organizationService.getOnboardingData()
        ]);

        // Combinar datos de organización con configuración de negocio y onboarding
        let organization = result.organization || result.data?.organization;
        
        // Enriquecer con datos de configuración de negocio
        if (businessConfigResult.status === 'fulfilled' && businessConfigResult.value.success) {
          const businessConfig = businessConfigResult.value.data || businessConfigResult.value.businessConfiguration;
          if (businessConfig) {
            organization.settings = {
              ...organization.settings,
              businessConfiguration: {
                appointmentModel: businessConfig.appointmentModel,
                allowClientSelection: businessConfig.settings?.allowClientSelection || false,
                bufferBetweenAppointments: businessConfig.settings?.bufferBetweenAppointments || 15,
                maxAdvanceBookingDays: businessConfig.settings?.maxAdvanceBookingDays || 30
              }
            };
          }
        }

        // Enriquecer con datos del onboarding
        if (onboardingResult.status === 'fulfilled' && onboardingResult.value.success) {
          const onboardingData = onboardingResult.value.onboardingStatus;
          if (onboardingData?.completedSteps) {
            // Extraer información de los steps completados para llenar campos faltantes
            for (const step of onboardingData.completedSteps) {
              switch (step.stepNumber) {
                case 2: // Organization Setup
                  if (step.data) {
                    if (!organization.address && step.data.businessAddress) {
                      organization.address = step.data.businessAddress;
                    }
                    if (!organization.phone && step.data.businessPhone) {
                      organization.phone = step.data.businessPhone;
                    }
                    if (!organization.email && step.data.businessEmail) {
                      organization.email = step.data.businessEmail;
                    }
                    if (!organization.currency && step.data.currency) {
                      organization.currency = step.data.currency;
                    }
                    if (!organization.settings.timezone && step.data.timezone) {
                      organization.settings.timezone = step.data.timezone;
                    }
                    if (!organization.settings.businessHours && step.data.businessHours) {
                      organization.settings.businessHours = step.data.businessHours;
                    }
                  }
                  break;
                case 4: // Services Setup
                  if (step.data?.services && !organization.settings.services) {
                    organization.settings.services = step.data.services;
                  }
                  break;
              }
            }
          }
        }

        // Establecer valores por defecto si no existen
        if (!organization.settings.businessInfo) {
          organization.settings.businessInfo = {
            businessName: organization.name,
            businessAddress: organization.address || '',
            businessPhone: organization.phone || '',
            businessEmail: organization.email || ''
          };
        }

        if (!organization.settings.appointmentSystem && organization.settings.businessConfiguration) {
          organization.settings.appointmentSystem = organization.settings.businessConfiguration;
        }

        // Actualizar estado con organización enriquecida
        const enrichedResult = {
          ...result,
          organization
        };
        
        const success = handleApiResponse(enrichedResult, 'Organización obtenida exitosamente', 'Error obteniendo la organización');
        console.log('✅ handleApiResponse resultado:', success);
      } else {
        const success = handleApiResponse(result, 'Organización obtenida exitosamente', 'Error obteniendo la organización');
        console.log('✅ handleApiResponse resultado:', success);
      }
    } catch (err) {
      console.error('❌ Error en fetchOrganization:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🚫 Request cancelado');
        return;
      }
      setError('Error de conexión al obtener la organización');
      setLoadingState('error');
    }
  }, [handleApiResponse, validateToken]);

  const updateSettings = useCallback(async (settings: UpdateOrganizationSettingsRequest) => {
    if (!organization) {
      setError('No hay organización cargada');
      return false;
    }

    if (!validateToken()) {
      return false;
    }

    setLoadingState('loading');
    setError(null);

    try {
      const result = await organizationService.updateOrganizationSettings(
        organization.id, 
        settings
      );
      
      return handleApiResponse(result, 'Configuración actualizada exitosamente', 'Error actualizando la configuración');
    } catch {
      setError('Error de conexión al actualizar la configuración');
      setLoadingState('error');
      return false;
    }
  }, [organization, handleApiResponse, validateToken]);

  useEffect(() => {
    fetchOrganization();
    
    // Cleanup: cancelar request al desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchOrganization]);

  return {
    organization,
    loadingState,
    error,
    updateSettings,
    refetch: fetchOrganization,
  };
};