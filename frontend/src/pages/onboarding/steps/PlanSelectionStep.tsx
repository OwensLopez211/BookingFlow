import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface PlanSelectionStepProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  initialData?: any;
  onPreviousStep?: () => void;
  canGoBack?: boolean;
  showBackInFooter?: boolean;
}

// Professional SVG Icons for Plans
const IconBasic = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconProfessional = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const IconEnterprise = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const IconCheck = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const IconX = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const plans = [
  {
    id: 'basic',
    name: 'Plan Básico',
    price: 'Gratis',
    period: 'por siempre',
    description: 'Perfect para pequeñas empresas que empiezan a probar nuestro sistema',
    icon: IconBasic,
    color: 'blue',
    available: true,
    popular: false,
    features: [
      { name: 'Hasta 50 citas por mes', included: true },
      { name: 'Gestión básica de calendario', included: true },
      { name: 'Confirmaciones por correo electrónico', included: true },
      { name: 'Panel de control básico', included: true },
      { name: 'Soporte por email', included: true },
      { name: 'Confirmaciones por SMS', included: false },
      { name: 'Confirmaciones por WhatsApp', included: false },
      { name: 'Cuentas de profesionales', included: false },
      { name: 'Reportes avanzados', included: false },
      { name: 'Integraciones avanzadas', included: false },
    ]
  },
  {
    id: 'professional',
    name: 'Plan Profesional',
    price: '$29',
    period: 'por mes',
    description: 'Para negocios en crecimiento con necesidades más avanzadas',
    icon: IconProfessional,
    color: 'green',
    available: false,
    popular: true,
    features: [
      { name: 'Citas ilimitadas', included: true },
      { name: 'Hasta 5 profesionales', included: true },
      { name: 'Confirmaciones por SMS y WhatsApp', included: true },
      { name: 'Reportes avanzados', included: true },
      { name: 'Recordatorios automáticos', included: true },
      { name: 'Gestión de inventario básica', included: true },
      { name: 'Soporte prioritario', included: true },
      { name: 'Personalización de marca', included: true },
      { name: 'API básica', included: true },
      { name: 'Backup automático', included: true },
    ]
  },
  {
    id: 'enterprise',
    name: 'Plan Empresarial',
    price: '$89',
    period: 'por mes',
    description: 'Para grandes empresas con múltiples ubicaciones y equipos',
    icon: IconEnterprise,
    color: 'purple',
    available: false,
    popular: false,
    features: [
      { name: 'Todo del Plan Profesional', included: true },
      { name: 'Profesionales ilimitados', included: true },
      { name: 'Múltiples ubicaciones', included: true },
      { name: 'Análisis avanzados y BI', included: true },
      { name: 'Integraciones personalizadas', included: true },
      { name: 'API completa', included: true },
      { name: 'Soporte 24/7', included: true },
      { name: 'Manager de cuenta dedicado', included: true },
      { name: 'Entrenamiento personalizado', included: true },
      { name: 'SLA garantizado', included: true },
    ]
  }
];

export const PlanSelectionStep: React.FC<PlanSelectionStepProps> = ({
  onComplete,
  isLoading,
  initialData,
  onPreviousStep,
  canGoBack,
  showBackInFooter
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(
    initialData?.planId || 'basic'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      alert('Por favor selecciona un plan');
      return;
    }

    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    
    onComplete({
      planId: selectedPlan,
      planName: selectedPlanData?.name,
      planPrice: selectedPlanData?.price,
    });
  };

  const getColorClasses = (color: string, selected: boolean, available: boolean) => {
    if (!available) {
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-400',
        icon: 'text-gray-400',
        badge: 'bg-gray-100 text-gray-500',
        iconBg: 'bg-gray-100',
        button: 'bg-gray-200 text-gray-500 cursor-not-allowed'
      };
    }

    const colors = {
      blue: selected 
        ? { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', iconBg: 'bg-blue-100', button: 'bg-blue-600 text-white hover:bg-blue-700' }
        : { bg: 'bg-white hover:bg-blue-50', border: 'border-gray-200 hover:border-blue-300', text: 'text-gray-900', icon: 'text-blue-500', badge: 'bg-gray-100 text-gray-600', iconBg: 'bg-gray-100 group-hover:bg-blue-100', button: 'bg-blue-600 text-white hover:bg-blue-700' },
      green: selected 
        ? { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-900', icon: 'text-green-600', badge: 'bg-green-100 text-green-700', iconBg: 'bg-green-100', button: 'bg-green-600 text-white hover:bg-green-700' }
        : { bg: 'bg-white hover:bg-green-50', border: 'border-gray-200 hover:border-green-300', text: 'text-gray-900', icon: 'text-green-500', badge: 'bg-gray-100 text-gray-600', iconBg: 'bg-gray-100 group-hover:bg-green-100', button: 'bg-green-600 text-white hover:bg-green-700' },
      purple: selected 
        ? { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-900', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', iconBg: 'bg-purple-100', button: 'bg-purple-600 text-white hover:bg-purple-700' }
        : { bg: 'bg-white hover:bg-purple-50', border: 'border-gray-200 hover:border-purple-300', text: 'text-gray-900', icon: 'text-purple-500', badge: 'bg-gray-100 text-gray-600', iconBg: 'bg-gray-100 group-hover:bg-purple-100', button: 'bg-purple-600 text-white hover:bg-purple-700' }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* Plans Grid - Compact without scroll */}
        <div className="flex-1 overflow-hidden">
          <div className="grid gap-3 md:grid-cols-3 h-full">
            {plans.map((plan) => {
              const IconComponent = plan.icon;
              const isSelected = selectedPlan === plan.id;
              const colorClasses = getColorClasses(plan.color, isSelected, plan.available);
              
              return (
                <div
                  key={plan.id}
                  className={`
                    relative flex flex-col p-3 border-2 rounded-lg transition-all duration-200
                    ${plan.available ? 'cursor-pointer hover:shadow-md group' : 'cursor-not-allowed'}
                    ${colorClasses.bg} ${colorClasses.border}
                    ${isSelected && plan.available ? 'shadow-md ring-2 ring-opacity-20' : ''}
                    ${!plan.available ? 'opacity-75' : ''}
                  `}
                  onClick={() => plan.available && setSelectedPlan(plan.id)}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Más Popular
                      </div>
                    </div>
                  )}

                  {/* Coming Soon Badge */}
                  {!plan.available && (
                    <div className="absolute -top-2 right-2">
                      <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Próximamente
                      </div>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-1.5 rounded-md transition-colors duration-200 ${colorClasses.iconBg}`}>
                      <IconComponent className={`w-5 h-5 ${colorClasses.icon}`} />
                    </div>
                    {plan.available && (
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
                    )}
                  </div>

                  {/* Plan Info */}
                  <div className="flex-1">
                    <h3 className={`font-bold text-sm mb-1 ${colorClasses.text}`}>
                      {plan.name}
                    </h3>
                    
                    <div className="mb-2">
                      <span className={`text-lg font-bold ${colorClasses.text}`}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-xs text-gray-500 ml-1">
                          {plan.period}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mb-3 leading-tight">
                      {plan.description}
                    </p>

                    {/* Features - Compact list */}
                    <div className="space-y-1">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          {feature.included ? (
                            <IconCheck className="w-3 h-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <IconX className="w-3 h-3 text-red-400 flex-shrink-0" />
                          )}
                          <span className={`text-xs leading-tight ${
                            feature.included ? 'text-gray-700' : 'text-gray-400'
                          }`}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                      {plan.features.length > 4 && (
                        <div className="text-xs text-gray-400">
                          +{plan.features.length - 4} características más
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hidden radio input */}
                  {plan.available && (
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={isSelected}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="sr-only"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-xs text-blue-700">
                Puedes cambiar tu plan en cualquier momento desde la configuración. Los planes Profesional y Empresarial estarán disponibles próximamente.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons - Fixed at bottom */}
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
            disabled={isLoading || !selectedPlan}
            className="px-4 py-1.5 text-sm"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                Guardando...
              </div>
            ) : (
              'Completar onboarding'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};