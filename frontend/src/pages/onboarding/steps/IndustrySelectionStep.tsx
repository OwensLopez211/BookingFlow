import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface IndustrySelectionStepProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  initialData?: any;
}

// Professional SVG Icons Component
const IconBeauty = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const IconMedical = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
  </svg>
);

const IconHyperbaric = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const IconFitness = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconConsultant = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IconCustom = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const industryOptions = [
  {
    value: 'beauty_salon',
    label: 'Salón de Belleza',
    description: 'Peluquerías, salones de belleza, spas',
    icon: IconBeauty,
    color: 'pink',
    features: ['Gestión de profesionales', 'Servicios personalizados', 'Comisiones']
  },
  {
    value: 'medical_clinic',
    label: 'Clínica Médica',
    description: 'Consultorios médicos, clínicas especializadas',
    icon: IconMedical,
    color: 'red',
    features: ['Historiales médicos', 'Citas especializadas', 'Seguros médicos']
  },
  {
    value: 'hyperbaric_center',
    label: 'Centro Hiperbárico',
    description: 'Cámaras hiperbáricas, tratamientos especializados',
    icon: IconHyperbaric,
    color: 'blue',
    features: ['Gestión de equipos', 'Protocolos médicos', 'Sesiones programadas']
  },
  {
    value: 'fitness_center',
    label: 'Centro de Fitness',
    description: 'Gimnasios, centros deportivos, entrenamientos',
    icon: IconFitness,
    color: 'green',
    features: ['Clases grupales', 'Entrenamientos personales', 'Equipamiento']
  },
  {
    value: 'consultant',
    label: 'Consultoría',
    description: 'Servicios de consultoría, coaching, asesorías',
    icon: IconConsultant,
    color: 'purple',
    features: ['Sesiones remotas', 'Facturación por horas', 'Calendario flexible']
  },
  {
    value: 'custom',
    label: 'Otro tipo de negocio',
    description: 'Personaliza completamente tu experiencia',
    icon: IconCustom,
    color: 'gray',
    features: ['Configuración personalizada', 'Máxima flexibilidad', 'Soporte dedicado']
  }
];

export const IndustrySelectionStep: React.FC<IndustrySelectionStepProps> = ({
  onComplete,
  isLoading,
  initialData
}) => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>(
    initialData?.industryType || ''
  );
  const [customIndustryName, setCustomIndustryName] = useState<string>(
    initialData?.customIndustryName || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedIndustry) {
      alert('Por favor selecciona un tipo de industria');
      return;
    }

    if (selectedIndustry === 'custom' && !customIndustryName.trim()) {
      alert('Por favor especifica el nombre de tu industria');
      return;
    }

    onComplete({
      industryType: selectedIndustry,
      ...(selectedIndustry === 'custom' && { customIndustryName })
    });
  };

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* Industry Options - Compact Grid without scroll */}
        <div className="flex-1 overflow-hidden">
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 h-full">
            {industryOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedIndustry === option.value;
              
              const getColorClasses = (color: string, selected: boolean) => {
                const colors = {
                  pink: selected 
                    ? { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-900', icon: 'text-pink-600', badge: 'bg-pink-100 text-pink-700', iconBg: 'bg-pink-100' }
                    : { bg: 'bg-white hover:bg-pink-50', border: 'border-gray-200 hover:border-pink-300', text: 'text-gray-900', icon: 'text-pink-500', badge: 'bg-gray-100 text-gray-600', iconBg: 'bg-gray-100 group-hover:bg-pink-100' },
                  red: selected 
                    ? { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-900', icon: 'text-red-600', badge: 'bg-red-100 text-red-700', iconBg: 'bg-red-100' }
                    : { bg: 'bg-white hover:bg-red-50', border: 'border-gray-200 hover:border-red-300', text: 'text-gray-900', icon: 'text-red-500', badge: 'bg-gray-100 text-gray-600', iconBg: 'bg-gray-100 group-hover:bg-red-100' },
                  blue: selected 
                    ? { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', iconBg: 'bg-blue-100' }
                    : { bg: 'bg-white hover:bg-blue-50', border: 'border-gray-200 hover:border-blue-300', text: 'text-gray-900', icon: 'text-blue-500', badge: 'bg-gray-100 text-gray-600', iconBg: 'bg-gray-100 group-hover:bg-blue-100' },
                  green: selected 
                    ? { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-900', icon: 'text-green-600', badge: 'bg-green-100 text-green-700', iconBg: 'bg-green-100' }
                    : { bg: 'bg-white hover:bg-green-50', border: 'border-gray-200 hover:border-green-300', text: 'text-gray-900', icon: 'text-green-500', badge: 'bg-gray-100 text-gray-600', iconBg: 'bg-gray-100 group-hover:bg-green-100' },
                  purple: selected 
                    ? { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-900', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', iconBg: 'bg-purple-100' }
                    : { bg: 'bg-white hover:bg-purple-50', border: 'border-gray-200 hover:border-purple-300', text: 'text-gray-900', icon: 'text-purple-500', badge: 'bg-gray-100 text-gray-600', iconBg: 'bg-gray-100 group-hover:bg-purple-100' },
                  gray: selected 
                    ? { bg: 'bg-gray-50', border: 'border-gray-500', text: 'text-gray-900', icon: 'text-gray-600', badge: 'bg-gray-100 text-gray-700', iconBg: 'bg-gray-100' }
                    : { bg: 'bg-white hover:bg-gray-50', border: 'border-gray-200 hover:border-gray-300', text: 'text-gray-900', icon: 'text-gray-500', badge: 'bg-gray-100 text-gray-600', iconBg: 'bg-gray-100 group-hover:bg-gray-200' }
                };
                return colors[color as keyof typeof colors] || colors.gray;
              };
              
              const colorClasses = getColorClasses(option.color, isSelected);
              
              return (
                <label
                  key={option.value}
                  className={`
                    relative flex flex-col p-2 border-2 rounded-lg cursor-pointer transition-all duration-200
                    hover:shadow-sm group
                    ${colorClasses.bg} ${colorClasses.border}
                    ${isSelected ? 'shadow-sm' : 'hover:shadow-md'}
                  `}
                >
                  <input
                    type="radio"
                    name="industry"
                    value={option.value}
                    checked={isSelected}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
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
                    <h3 className={`font-semibold text-xs mb-1 ${colorClasses.text}`}>
                      {option.label}
                    </h3>
                    <p className={`text-xs leading-tight mb-2 ${
                      isSelected ? colorClasses.text.replace('900', '700') : 'text-gray-600'
                    }`}>
                      {option.description}
                    </p>
                    
                    {/* Features - Only show first feature to save space */}
                    <div className="flex flex-wrap gap-1">
                      <span
                        className={`
                          inline-block px-1.5 py-0.5 text-xs rounded-full font-medium transition-colors duration-200
                          ${colorClasses.badge}
                        `}
                      >
                        {option.features[0]}
                      </span>
                      {option.features.length > 1 && (
                        <span className="text-xs text-gray-400 self-center">
                          +{option.features.length - 1}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Custom Industry Name Input - More compact */}
          {selectedIndustry === 'custom' && (
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                ¿Cuál es tu tipo de negocio?
              </label>
              <input
                type="text"
                value={customIndustryName}
                onChange={(e) => setCustomIndustryName(e.target.value)}
                placeholder="Ej: Veterinaria, Taller automotriz..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required={selectedIndustry === 'custom'}
              />
            </div>
          )}
        </div>

        {/* Button - Fixed at bottom, more compact */}
        <div className="flex justify-end pt-2 border-t border-gray-100 mt-2">
          <Button
            type="submit"
            disabled={isLoading || !selectedIndustry}
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