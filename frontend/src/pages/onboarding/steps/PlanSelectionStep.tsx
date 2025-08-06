import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plan, PlanSelection, OneClickSetupFormData } from '../../../../types/subscription';
import { transbankService } from '../../../services/transbankService';
import { useAuth } from '@/hooks/useAuth';

interface PlanSelectionStepProps {
  onComplete: (data: PlanSelection) => void;
  isLoading: boolean;
  initialData?: PlanSelection;
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

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Plan Gratuito',
    price: 'Gratis',
    period: 'siempre',
    description: 'Perfecto para emprendedores que están empezando y quieren probar la plataforma',
    icon: IconBasic,
    color: 'gray',
    available: true,
    popular: false,
    features: [
      { name: 'Hasta 1 recurso/profesional', included: true },
      { name: 'Máximo 100 citas por mes', included: true },
      { name: 'Solo 1 usuario (propietario)', included: true },
      { name: 'Panel de control básico', included: true },
      { name: 'Soporte por email', included: true },
    ]
  },
  {
    id: 'basic',
    name: 'Plan Básico',
    price: '$14.990',
    period: 'por mes (+IVA)',
    description: 'Perfecto para pequeñas empresas que necesitan agilizar su gestión de citas',
    icon: IconProfessional,
    color: 'blue',
    available: true,
    popular: true,
    trialDays: 30,
    transbankAmount: 14990,
    features: [
      { name: 'Hasta 5 recursos/profesionales', included: true },
      { name: 'Máximo 1,000 citas por mes', included: true },
      { name: 'Hasta 2 usuarios (propietario + recepcionista)', included: true },
      { name: 'Confirmación automática de citas por email', included: true },
      { name: 'Cuenta de recepcionista incluida', included: true },
      { name: 'Soporte ágil vía correo electrónico', included: true },
      { name: 'Panel de control completo', included: true },
      { name: 'Agenda unificada con vista día/semana', included: true },
      { name: 'Filtros por profesional o servicio', included: true },
      { name: '1 mes completamente gratis', included: true },
    ]
  },
  {
    id: 'premium',
    name: 'Plan Premium',
    price: '$29.990',
    period: 'por mes (+IVA)',
    description: 'Para empresas grandes con múltiples profesionales y alto volumen de citas',
    icon: IconEnterprise,
    color: 'purple',
    available: false,
    popular: false,
    transbankAmount: 29990,
    trialDays: 30,
    features: [
      { name: 'Hasta 10 recursos/profesionales', included: true },
      { name: 'Máximo 2,500 citas por mes', included: true },
      { name: 'Hasta 10 usuarios', included: true },
      { name: 'Todo del Plan Básico', included: true },
      { name: 'Reportes avanzados', included: true },
      { name: 'API completa', included: true },
      { name: 'Soporte prioritario 24/7', included: true },
      { name: 'Personalización de marca', included: true },
      { name: 'Integraciones personalizadas', included: true },
      { name: 'Backup automático', included: true },
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
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>(
    initialData?.planId || 'free'
  );
  const [showOneclickSetup, setShowOneclickSetup] = useState(false);
  const [oneclickForm, setOneclickForm] = useState<OneClickSetupFormData>({
    email: user?.email || '',
    acceptTerms: false,
  });
  const [isSettingUpOneclick, setIsSettingUpOneclick] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      alert('Por favor selecciona un plan');
      return;
    }

    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    
    // Si es plan básico o premium, mostrar configuración OneClick
    if (selectedPlan === 'basic' || selectedPlan === 'premium') {
      setShowOneclickSetup(true);
      return;
    }

    // Plan gratuito - completar directamente
    onComplete({
      planId: selectedPlan,
      planName: selectedPlanData?.name,
      planPrice: selectedPlanData?.price,
      planPeriod: selectedPlanData?.period,
      transbankAmount: selectedPlanData?.transbankAmount,
      trialDays: selectedPlanData?.trialDays,
      requiresPayment: false,
      enableOneClick: false,
    });
  };

  const handleOneclickSetup = async () => {
    if (!oneclickForm.acceptTerms) {
      alert('Debes aceptar los términos y condiciones para continuar');
      return;
    }

    if (!user?.orgId) {
      alert('Error: No se pudo obtener la información de la organización');
      return;
    }

    setIsSettingUpOneclick(true);

    try {
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      const returnUrl = `${window.location.origin}/onboarding/oneclick-return`;
      
      // Iniciar inscripción OneClick directamente
      // Generate a shorter username (max 40 chars for Transbank)
      const shortUsername = `u_${user.orgId.replace(/-/g, '').substring(0, 32)}`;
      const inscriptionData = await transbankService.startOneclickInscription({
        username: shortUsername,
        email: user.email,
        returnUrl: returnUrl,
      });

      // GUARDAR los datos del plan en localStorage para completar después del return de OneClick
      const planData = {
        planId: selectedPlan,
        planName: selectedPlanData?.name,
        planPrice: selectedPlanData?.price,
        planPeriod: selectedPlanData?.period,
        transbankAmount: selectedPlanData?.transbankAmount,
        trialDays: selectedPlanData?.trialDays,
        requiresPayment: true,
        enableOneClick: true,
        oneclickData: {
          username: shortUsername,
          email: user.email,
          returnUrl: returnUrl,
        }
      };
      
      localStorage.setItem('pendingPlanData', JSON.stringify(planData));
      
      // Redirigir al usuario a Webpay usando POST con TBK_TOKEN según documentación de Transbank
      console.log('🔗 Redirecting to Transbank Webpay via POST:', inscriptionData);
      transbankService.redirectToTransbankWebpay(inscriptionData.urlWebpay, inscriptionData.token);
    } catch (error) {
      console.error('Error setting up OneClick:', error);
      alert('Error configurando el método de pago. Por favor, inténtalo de nuevo.');
      setIsSettingUpOneclick(false);
    }
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
        {/* Plans Grid - Multiple plans */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
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
                      {plan.trialDays && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          🎉 {plan.trialDays === 30 ? '1 mes completamente gratis' : `Prueba gratuita ${plan.trialDays} días`}
                        </div>
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
                <strong>Planes disponibles:</strong> Plan Gratuito para empezar y Plan Básico con 1 mes completamente gratis. El Plan Premium estará disponible próximamente.
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
                Completando registro...
              </div>
            ) : (
              selectedPlan === 'basic' || selectedPlan === 'premium' ? 'Configurar método de pago' : 'Completar registro'
            )}
          </Button>
        </div>
      </form>

      {/* OneClick Setup Modal */}
      {showOneclickSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Configurar método de pago
              </h3>
              <button
                onClick={() => setShowOneclickSetup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm text-blue-700">
                      <strong>¿Cómo funciona?</strong>
                    </p>
                    <ul className="text-xs text-blue-600 mt-1 space-y-1">
                      <li>• Registraremos tu tarjeta con un cobro de $1 peso</li>
                      <li>• Comenzarás tu mes gratuito inmediatamente</li>
                      <li>• Al finalizar el trial, se cobrará automáticamente</li>
                      <li>• Puedes cancelar antes del cobro sin costos</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-sm text-gray-700">
                        <strong>Email de confirmación:</strong> {user?.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Se enviará la confirmación a este email después de configurar el método de pago.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={oneclickForm.acceptTerms}
                    onChange={(e) => setOneclickForm({ ...oneclickForm, acceptTerms: e.target.checked })}
                    className="mt-1 mr-2"
                    required
                  />
                  <label htmlFor="acceptTerms" className="text-xs text-gray-600">
                    Acepto los <a href="#" className="text-blue-600 hover:underline">términos y condiciones</a> y 
                    autorizo el cobro automático de mi suscripción mensual de{' '}
                    <strong>${plans.find(p => p.id === selectedPlan)?.transbankAmount?.toLocaleString('es-CL')}</strong> 
                    {' '}al finalizar el período de prueba gratuito de {plans.find(p => p.id === selectedPlan)?.trialDays} días.
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowOneclickSetup(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSettingUpOneclick}
              >
                Cancelar
              </button>
              <button
                onClick={handleOneclickSetup}
                disabled={!oneclickForm.acceptTerms || isSettingUpOneclick}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSettingUpOneclick ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Configurando...
                  </div>
                ) : (
                  'Configurar método de pago'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};