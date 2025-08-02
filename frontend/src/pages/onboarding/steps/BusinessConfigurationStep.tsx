import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface BusinessConfigurationStepProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  initialData?: any;
  onPreviousStep?: () => void;
  canGoBack?: boolean;
  showBackInFooter?: boolean;
}

// Professional SVG Icons for Business Configuration
const IconProfessional = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconResource = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const IconHybrid = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const appointmentModels = [
  {
    value: 'professional_based',
    title: 'Basado en Profesionales',
    description: 'Los clientes reservan citas con profesionales específicos',
    icon: IconProfessional,
    color: 'blue',
    examples: ['Salones de belleza', 'Consultorios médicos', 'Consultoría'],
    features: ['Cada profesional tiene su horario', 'Clientes eligen al profesional', 'Gestión de especialidades']
  },
  {
    value: 'resource_based',
    title: 'Basado en Recursos',
    description: 'Los clientes reservan equipos, salas o instalaciones',
    icon: IconResource,
    color: 'green',
    examples: ['Centros hiperbáricos', 'Salas de reuniones', 'Estudios de grabación'],
    features: ['Gestión de equipos', 'Capacidad por recurso', 'Mantenimiento programado']
  },
  {
    value: 'hybrid',
    title: 'Híbrido',
    description: 'Combina profesionales y recursos para máxima flexibilidad',
    icon: IconHybrid,
    color: 'purple',
    examples: ['Gimnasios', 'Clínicas especializadas', 'Centros de bienestar'],
    features: ['Lo mejor de ambos mundos', 'Máxima flexibilidad', 'Configuración avanzada']
  }
];

export const BusinessConfigurationStep: React.FC<BusinessConfigurationStepProps> = ({
  onComplete,
  isLoading,
  initialData,
  onPreviousStep,
  canGoBack,
  showBackInFooter
}) => {
  const [formData, setFormData] = useState({
    appointmentModel: initialData?.appointmentModel || 'professional_based',
    allowClientSelection: initialData?.allowClientSelection ?? true,
    bufferBetweenAppointments: initialData?.bufferBetweenAppointments || 15,
    maxAdvanceBookingDays: initialData?.maxAdvanceBookingDays || 30,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.appointmentModel) {
      alert('Por favor selecciona un modelo de citas');
      return;
    }

    if (formData.bufferBetweenAppointments < 0 || formData.maxAdvanceBookingDays < 1) {
      alert('Por favor verifica que los valores numéricos sean válidos');
      return;
    }

    onComplete(formData);
  };

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* Content - Compact, no scroll */}
        <div className="flex-1 overflow-hidden space-y-4">
          {/* Appointment Model Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              ¿Cómo funciona tu sistema de citas?
            </h3>
            <div className="space-y-2">
              {appointmentModels.map((model) => {
                const IconComponent = model.icon;
                const isSelected = formData.appointmentModel === model.value;
                const isDisabled = model.value === 'hybrid'; // Disable hybrid option
                
                const getColorClasses = (color: string, selected: boolean, disabled: boolean) => {
                  if (disabled) {
                    return {
                      bg: 'bg-gray-50',
                      border: 'border-gray-200',
                      text: 'text-gray-400',
                      icon: 'text-gray-300',
                      badge: 'bg-gray-100 text-gray-400',
                      iconBg: 'bg-gray-100'
                    };
                  }
                  
                  const colors = {
                    blue: selected 
                      ? { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', iconBg: 'bg-blue-100' }
                      : { bg: 'bg-white hover:bg-blue-50', border: 'border-gray-200 hover:border-blue-300', text: 'text-gray-900', icon: 'text-blue-500', badge: 'bg-gray-100 text-gray-600', iconBg: 'bg-gray-100 group-hover:bg-blue-100' },
                    green: selected 
                      ? { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-900', icon: 'text-green-600', badge: 'bg-green-100 text-green-700', iconBg: 'bg-green-100' }
                      : { bg: 'bg-white hover:bg-green-50', border: 'border-gray-200 hover:border-green-300', text: 'text-gray-900', icon: 'text-green-500', badge: 'bg-gray-100 text-gray-600', iconBg: 'bg-gray-100 group-hover:bg-green-100' },
                    purple: selected 
                      ? { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-900', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', iconBg: 'bg-purple-100' }
                      : { bg: 'bg-white hover:bg-purple-50', border: 'border-gray-200 hover:border-purple-300', text: 'text-gray-900', icon: 'text-purple-500', badge: 'bg-gray-100 text-gray-600', iconBg: 'bg-gray-100 group-hover:bg-purple-100' }
                  };
                  return colors[color as keyof typeof colors] || colors.blue;
                };
                
                const colorClasses = getColorClasses(model.color, isSelected, isDisabled);
                
                return (
                  <label
                    key={model.value}
                    className={`
                      relative flex flex-col p-2 border-2 rounded-lg transition-all duration-200
                      ${isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:shadow-sm group'}
                      ${colorClasses.bg} ${colorClasses.border}
                      ${isSelected ? 'shadow-sm' : !isDisabled && 'hover:shadow-md'}
                    `}
                  >
                    {/* Próximamente Badge for Hybrid */}
                    {isDisabled && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full border border-amber-200 shadow-sm">
                          Próximamente
                        </span>
                      </div>
                    )}
                    
                    <input
                      type="radio"
                      name="appointmentModel"
                      value={model.value}
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={(e) => handleInputChange('appointmentModel', e.target.value)}
                      className="sr-only"
                    />
                    
                    {/* Header with Icon and Radio */}
                    <div className="flex items-center justify-between mb-2">
                      <div className={`
                        p-1.5 rounded-md transition-colors duration-200
                        ${colorClasses.iconBg}
                      `}>
                        <IconComponent className={`w-4 h-4 ${colorClasses.icon}`} />
                      </div>
                      <div className={`
                        w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all duration-200
                        ${isSelected
                          ? colorClasses.border.split(' ')[0] + ' ' + colorClasses.bg.split(' ')[0].replace('bg-', 'bg-').replace('-50', '-500')
                          : 'border-gray-300 group-hover:border-gray-400'
                        }
                      `}>
                        {isSelected && (
                          <div className="w-1 h-1 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h4 className={`font-semibold text-xs mb-1 ${colorClasses.text}`}>
                        {model.title}
                      </h4>
                      <p className={`text-xs leading-tight mb-2 ${
                        isSelected ? colorClasses.text.replace('900', '700') : 'text-gray-600'
                      }`}>
                        {model.description}
                      </p>
                      
                      {/* Examples - Only show first one */}
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`
                            inline-block px-1.5 py-0.5 text-xs rounded-full font-medium transition-colors duration-200
                            ${colorClasses.badge}
                          `}
                        >
                          {model.examples[0]}
                        </span>
                        {model.examples.length > 1 && (
                          <span className="text-xs text-gray-400 self-center">
                            +{model.examples.length - 1}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Additional Settings */}
          <div className="border-t pt-3">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                Configuraciones adicionales
              </h3>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 space-y-4 border border-gray-200">
              {/* Client Selection */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="allowClientSelection"
                      checked={formData.allowClientSelection}
                      onChange={(e) => handleInputChange('allowClientSelection', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                    />
                    {formData.allowClientSelection && (
                      <div className="absolute inset-0 bg-blue-600 rounded flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label htmlFor="allowClientSelection" className="block text-xs font-semibold text-gray-900 mb-1">
                      Selección específica por cliente
                    </label>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Permite que los clientes elijan profesional o recurso específico al hacer su reserva
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${formData.allowClientSelection ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
              </div>

              {/* Buffer Time & Advance Booking */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md flex items-center justify-center">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <label className="text-xs font-semibold text-gray-900">
                      Buffer entre citas
                    </label>
                  </div>
                  <select
                    value={formData.bufferBetweenAppointments}
                    onChange={(e) => handleInputChange('bufferBetweenAppointments', parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value={0}>Sin buffer</option>
                    <option value={5}>5 minutos</option>
                    <option value={10}>10 minutos</option>
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Tiempo libre entre citas consecutivas
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-green-100 to-green-200 rounded-md flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <label className="text-xs font-semibold text-gray-900">
                      Anticipación máxima
                    </label>
                  </div>
                  <select
                    value={formData.maxAdvanceBookingDays}
                    onChange={(e) => handleInputChange('maxAdvanceBookingDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value={7}>1 semana</option>
                    <option value={14}>2 semanas</option>
                    <option value={30}>1 mes</option>
                    <option value={60}>2 meses</option>
                    <option value={90}>3 meses</option>
                    <option value={180}>6 meses</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo tiempo de antelación para reservar
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Success Info - More compact */}
          <div className="bg-green-50 border border-green-200 rounded-md p-2">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs text-green-700">
                  ¡Casi terminamos! Podrás ajustar estas configuraciones más tarde.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons - Fixed at bottom, more compact */}
        <div className="flex justify-between pt-2 border-t border-gray-100 mt-3">
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
            disabled={isLoading}
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