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
    id: 'basic',
    name: 'Plan Básico',
    price: '$14.990',
    period: 'por mes (+IVA)',
    description: 'Perfecto para pequeñas empresas que necesitan agilizar su gestión de citas',
    icon: IconBasic,
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
    id: 'professional',
    name: 'Plan Profesional',
    price: '$29.990',
    period: 'por mes (+IVA)',
    description: 'Para empresas medianas con múltiples profesionales y más funcionalidades',
    icon: IconProfessional,
    color: 'green',
    available: false,
    popular: false,
    transbankAmount: 29990,
    trialDays: 30,
    features: [
      { name: 'Hasta 10 recursos/profesionales', included: true },
      { name: 'Máximo 2,500 citas por mes', included: true },
      { name: 'Hasta 5 usuarios', included: true },
      { name: 'Todo del Plan Básico', included: true },
      { name: 'Reportes avanzados', included: true },
      { name: 'Recordatorios automáticos por SMS', included: true },
      { name: 'Integraciones con calendario', included: true },
      { name: 'Soporte prioritario por teléfono', included: true },
      { name: 'Personalización de marca básica', included: true },
      { name: 'Backup automático diario', included: true },
    ]
  },
  {
    id: 'enterprise',
    name: 'Plan Enterprise',
    price: '$59.990',
    period: 'por mes (+IVA)',
    description: 'Para empresas grandes con necesidades avanzadas y múltiples ubicaciones',
    icon: IconEnterprise,
    color: 'purple',
    available: false,
    popular: false,
    transbankAmount: 59990,
    trialDays: 30,
    features: [
      { name: 'Recursos/profesionales ilimitados', included: true },
      { name: 'Citas ilimitadas por mes', included: true },
      { name: 'Usuarios ilimitados', included: true },
      { name: 'Todo del Plan Profesional', included: true },
      { name: 'API completa para integraciones', included: true },
      { name: 'Múltiples ubicaciones', included: true },
      { name: 'Soporte dedicado 24/7', included: true },
      { name: 'Personalización completa de marca', included: true },
      { name: 'Integraciones personalizadas', included: true },
      { name: 'Backup en tiempo real', included: true },
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
    initialData?.planId || 'basic'
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
    
    // Todos los planes disponibles requieren configuración OneClick
    if (selectedPlanData?.available) {
      setShowOneclickSetup(true);
      return;
    }

    // Fallback si no hay plan disponible seleccionado
    alert('El plan seleccionado no está disponible actualmente');
    return;
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
        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-6xl mx-auto px-4">
            {plans.map((plan) => {
              const IconComponent = plan.icon;
              const isSelected = selectedPlan === plan.id;
              const colorClasses = getColorClasses(plan.color, isSelected, plan.available);
              
              return (
                <div
                  key={plan.id}
                  className={`
                    relative flex flex-col border-2 rounded-2xl transition-all duration-300 transform
                    ${plan.available ? 'cursor-pointer hover:shadow-2xl hover:scale-105 group' : 'cursor-not-allowed'}
                    ${colorClasses.bg} ${colorClasses.border}
                    ${isSelected && plan.available ? 'shadow-2xl ring-4 ring-blue-200 scale-105' : 'shadow-lg'}
                    ${!plan.available ? 'opacity-60 grayscale' : ''}
                    overflow-hidden
                  `}
                  onClick={() => plan.available && setSelectedPlan(plan.id)}
                >
                  {/* Background gradient overlay */}
                  <div className={`absolute inset-0 opacity-5 ${
                    plan.color === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                    plan.color === 'green' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                    'bg-gradient-to-br from-purple-400 to-purple-600'
                  }`} />

                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white text-sm px-4 py-2 rounded-full font-semibold shadow-lg">
                        ⭐ Más Popular
                      </div>
                    </div>
                  )}

                  {/* Coming Soon Badge */}
                  {!plan.available && (
                    <div className="absolute -top-1 right-4 z-10">
                      <div className="bg-gradient-to-r from-gray-400 to-gray-600 text-white text-sm px-4 py-2 rounded-full font-semibold shadow-lg">
                        🚀 Próximamente
                      </div>
                    </div>
                  )}

                  {/* Header Section */}
                  <div className={`relative p-4 pb-3 ${plan.popular ? 'pt-6' : 'pt-4'}`}>
                    {/* Icon and Selection Circle */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-xl transition-all duration-300 ${colorClasses.iconBg} ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
                        <IconComponent className={`w-6 h-6 ${colorClasses.icon}`} />
                      </div>
                      {plan.available && (
                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300
                          ${isSelected
                            ? 'border-blue-500 bg-blue-500 shadow-lg'
                            : 'border-gray-300 group-hover:border-blue-400 group-hover:bg-blue-50'
                          }
                        `}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Plan Name and Price */}
                    <div className="mb-3">
                      <h3 className={`text-xl font-bold mb-1 ${colorClasses.text}`}>
                        {plan.name}
                      </h3>
                      
                      <div className="flex items-baseline mb-2">
                        <span className={`text-2xl font-bold ${colorClasses.text}`}>
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className="text-xs text-gray-500 ml-1 font-medium">
                            {plan.period}
                          </span>
                        )}
                      </div>

                      {plan.trialDays && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                          <span className="text-xs text-green-700 font-semibold">
                            🎉 {plan.trialDays === 30 ? '1 mes gratis' : `${plan.trialDays} días gratis`}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-600 leading-relaxed mb-4 text-sm">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features Section */}
                  <div className="flex-1 px-4 pb-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-3">
                        Características incluidas
                      </h4>
                      
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="flex-shrink-0 mt-0.5">
                            {feature.included ? (
                              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                                <IconCheck className="w-2.5 h-2.5 text-green-600" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                                <IconX className="w-2.5 h-2.5 text-red-500" />
                              </div>
                            )}
                          </div>
                          <span className={`text-xs leading-relaxed ${
                            feature.included ? 'text-gray-700' : 'text-gray-400 line-through'
                          }`}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selection Overlay for Selected Plan */}
                  {isSelected && plan.available && (
                    <div className="absolute inset-0 border-4 border-blue-400 rounded-2xl pointer-events-none">
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}

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

        {/* Info Notice - Compact */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 mt-4 mx-4">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700">
              <strong>Plan disponible:</strong> Plan Básico con 1 mes gratis. Planes Profesional y Enterprise próximamente.
            </p>
          </div>
        </div>

        {/* Buttons - Fixed at bottom */}
        <div className="flex flex-col sm:flex-row justify-between gap-2 pt-3 border-t border-gray-200 mt-3 mx-4">
          {showBackInFooter && canGoBack && onPreviousStep ? (
            <button
              type="button"
              onClick={onPreviousStep}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-300 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Atrás</span>
            </button>
          ) : (
            <div className="hidden sm:block"></div>
          )}
          
          <Button
            type="submit"
            disabled={isLoading || !selectedPlan}
            className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-lg transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Completando registro...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Configurar método de pago
              </div>
            )}
          </Button>
        </div>
      </form>

      {/* OneClick Setup Modal */}
      {showOneclickSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 rounded-t-2xl">
              <button
                onClick={() => setShowOneclickSetup(false)}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all duration-200"
                disabled={isSettingUpOneclick}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-3 pr-12">
                <div className="p-2 sm:p-3 bg-white/10 rounded-xl">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">
                    Configurar método de pago
                  </h3>
                  <p className="text-blue-100 mt-1 text-sm sm:text-base">
                    Configura tu suscripción para comenzar tu mes gratuito
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Plan Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {plans.find(p => p.id === selectedPlan)?.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {plans.find(p => p.id === selectedPlan)?.description}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {plans.find(p => p.id === selectedPlan)?.price}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {plans.find(p => p.id === selectedPlan)?.period}
                    </div>
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">
                      ¿Cómo funciona el proceso?
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-700">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <span>Registro seguro con Transbank</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <span>Cargo de verificación de $1 peso</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <span>Mes gratuito comienza inmediatamente</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                        <span>Cancela antes del cobro sin costos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Confirmation */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Email de confirmación
                    </h4>
                    <p className="text-sm text-gray-600">
                      <strong>{user?.email}</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Recibirás la confirmación y detalles de tu suscripción en este email.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={oneclickForm.acceptTerms}
                      onChange={(e) => setOneclickForm({ ...oneclickForm, acceptTerms: e.target.checked })}
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      required
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-gray-700 leading-relaxed">
                      <span className="font-semibold">Acepto los términos:</span>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• Los <a href="#" className="text-blue-600 hover:underline font-medium">términos y condiciones</a> del servicio</li>
                        <li>• El cobro automático mensual de <strong className="text-green-600">${plans.find(p => p.id === selectedPlan)?.transbankAmount?.toLocaleString('es-CL')}</strong></li>
                        <li>• El período de prueba gratuito de <strong className="text-blue-600">{plans.find(p => p.id === selectedPlan)?.trialDays} días</strong></li>
                        <li>• La posibilidad de cancelar en cualquier momento sin penalizaciones</li>
                      </ul>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-4 rounded-b-2xl">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowOneclickSetup(false)}
                    className="flex-1 px-4 sm:px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
                    disabled={isSettingUpOneclick}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleOneclickSetup}
                    disabled={!oneclickForm.acceptTerms || isSettingUpOneclick}
                    className="flex-1 px-4 sm:px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  >
                    {isSettingUpOneclick ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="hidden sm:inline">Configurando método de pago...</span>
                        <span className="sm:hidden">Configurando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="hidden sm:inline">Continuar con Transbank</span>
                        <span className="sm:hidden">Continuar</span>
                      </div>
                    )}
                  </button>
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-center">Transacción 100% segura con Transbank</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};