import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface ServicesSetupStepProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  initialData?: any;
  industryType?: string;
  onPreviousStep?: () => void;
  canGoBack?: boolean;
  showBackInFooter?: boolean;
}

interface Service {
  id: string;
  name: string;
  duration: number; // en minutos
  price: number;
  description?: string;
  isDefault?: boolean;
}

// Servicios predefinidos por industria
const getServicesByIndustry = (industryType: string): Service[] => {
  const serviceTemplates = {
    beauty_salon: [
      { id: 'haircut', name: 'Corte de Cabello', duration: 60, price: 25000, description: 'Corte y peinado profesional' },
      { id: 'hair_color', name: 'Coloración', duration: 120, price: 45000, description: 'Tinte y coloración completa' },
      { id: 'manicure', name: 'Manicure', duration: 45, price: 15000, description: 'Cuidado completo de uñas' },
      { id: 'pedicure', name: 'Pedicure', duration: 60, price: 18000, description: 'Cuidado completo de pies' },
      { id: 'facial', name: 'Limpieza Facial', duration: 90, price: 35000, description: 'Tratamiento facial completo' },
      { id: 'eyebrows', name: 'Depilación Cejas', duration: 30, price: 12000, description: 'Perfilado y depilación de cejas' },
    ],
    medical_clinic: [
      { id: 'consultation', name: 'Consulta General', duration: 30, price: 30000, description: 'Consulta médica general' },
      { id: 'checkup', name: 'Control de Salud', duration: 45, price: 40000, description: 'Examen médico preventivo' },
      { id: 'specialist', name: 'Consulta Especialista', duration: 45, price: 60000, description: 'Consulta con médico especialista' },
      { id: 'lab_test', name: 'Exámenes de Laboratorio', duration: 15, price: 25000, description: 'Toma de muestras para análisis' },
      { id: 'vaccination', name: 'Vacunación', duration: 15, price: 20000, description: 'Aplicación de vacunas' },
    ],
    hyperbaric_center: [
      { id: 'hyperbaric_session', name: 'Sesión Hiperbárica', duration: 90, price: 80000, description: 'Sesión en cámara hiperbárica' },
      { id: 'evaluation', name: 'Evaluación Médica', duration: 45, price: 50000, description: 'Evaluación previa al tratamiento' },
      { id: 'wound_care', name: 'Cuidado de Heridas', duration: 60, price: 35000, description: 'Tratamiento especializado de heridas' },
      { id: 'follow_up', name: 'Control de Seguimiento', duration: 30, price: 25000, description: 'Control post-tratamiento' },
    ],
    fitness_center: [
      { id: 'personal_training', name: 'Entrenamiento Personal', duration: 60, price: 35000, description: 'Sesión personalizada con entrenador' },
      { id: 'group_class', name: 'Clase Grupal', duration: 45, price: 12000, description: 'Clase de ejercicios en grupo' },
      { id: 'nutritional_advice', name: 'Asesoría Nutricional', duration: 60, price: 40000, description: 'Consulta con nutricionista' },
      { id: 'fitness_evaluation', name: 'Evaluación Física', duration: 45, price: 25000, description: 'Evaluación completa del estado físico' },
      { id: 'massage', name: 'Masaje Deportivo', duration: 60, price: 30000, description: 'Masaje terapéutico post-ejercicio' },
    ],
    consultant: [
      { id: 'consultation', name: 'Consulta Inicial', duration: 60, price: 50000, description: 'Primera consulta y diagnóstico' },
      { id: 'coaching_session', name: 'Sesión de Coaching', duration: 90, price: 75000, description: 'Sesión de coaching personalizado' },
      { id: 'workshop', name: 'Taller Grupal', duration: 120, price: 45000, description: 'Taller educativo grupal' },
      { id: 'follow_up', name: 'Seguimiento', duration: 30, price: 25000, description: 'Sesión de seguimiento' },
    ],
    custom: [
      { id: 'service_1', name: 'Servicio Básico', duration: 60, price: 25000, description: 'Servicio principal' },
      { id: 'service_2', name: 'Servicio Premium', duration: 90, price: 40000, description: 'Servicio con valor agregado' },
      { id: 'consultation', name: 'Consulta', duration: 30, price: 15000, description: 'Consulta inicial' },
    ],
  };

  return serviceTemplates[industryType as keyof typeof serviceTemplates] || serviceTemplates.custom;
};

export const ServicesSetupStep: React.FC<ServicesSetupStepProps> = ({
  onComplete,
  isLoading,
  initialData,
  industryType = 'custom',
  onPreviousStep,
  canGoBack,
  showBackInFooter
}) => {
  const [selectedServices, setSelectedServices] = useState<Service[]>(
    initialData?.services || []
  );
  const [availableServices] = useState<Service[]>(
    getServicesByIndustry(industryType)
  );

  // Auto-select popular services based on industry
  useEffect(() => {
    if (selectedServices.length === 0) {
      const defaultServices = availableServices.slice(0, 3); // Select first 3 services
      setSelectedServices(defaultServices);
    }
  }, [availableServices, selectedServices.length]);

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const updateServicePrice = (serviceId: string, newPrice: number) => {
    setSelectedServices(prev =>
      prev.map(service =>
        service.id === serviceId ? { ...service, price: newPrice } : service
      )
    );
  };

  const updateServiceDuration = (serviceId: string, newDuration: number) => {
    setSelectedServices(prev =>
      prev.map(service =>
        service.id === serviceId ? { ...service, duration: newDuration } : service
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedServices.length === 0) {
      alert('Por favor selecciona al menos un servicio');
      return;
    }

    onComplete({
      services: selectedServices,
      industryType
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* Services Grid */}
        <div className="flex-1 overflow-hidden">
          <div className="space-y-3 max-h-full overflow-y-auto">
            {availableServices.map((service) => {
              const isSelected = selectedServices.some(s => s.id === service.id);
              const selectedService = selectedServices.find(s => s.id === service.id);
              
              return (
                <div
                  key={service.id}
                  className={`
                    border-2 rounded-lg p-3 transition-all duration-200 cursor-pointer
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => toggleService(service)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`
                        w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300'
                        }
                      `}>
                        {isSelected && (
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`font-semibold text-sm ${
                          isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {service.name}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Editable fields when selected */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Duración (min)
                          </label>
                          <input
                            type="number"
                            min="15"
                            max="480"
                            step="15"
                            value={selectedService?.duration || service.duration}
                            onChange={(e) => updateServiceDuration(service.id, parseInt(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Precio ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={selectedService?.price || service.price}
                            onChange={(e) => updateServicePrice(service.id, parseInt(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price preview when not selected */}
                  {!isSelected && (
                    <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                      <span>{service.duration} min</span>
                      <span className="font-medium">{formatPrice(service.price)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Services Summary */}
        {selectedServices.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-2 mt-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs text-green-700">
                  {selectedServices.length} servicio{selectedServices.length !== 1 ? 's' : ''} seleccionado{selectedServices.length !== 1 ? 's' : ''}. 
                  Podrás agregar más servicios después desde la configuración.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
          {showBackInFooter && canGoBack && onPreviousStep ? (
            <button
              type="button"
              onClick={onPreviousStep}
              className="flex items-center space-x-2 px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Atrás</span>
            </button>
          ) : (
            <div></div>
          )}
          
          <Button
            type="submit"
            disabled={isLoading || selectedServices.length === 0}
            className="px-4 py-1.5 text-sm"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                Guardando...
              </div>
            ) : (
              'Continuar'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};