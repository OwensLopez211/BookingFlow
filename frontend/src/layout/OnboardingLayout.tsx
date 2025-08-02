import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  onPreviousStep?: () => void;
  canGoBack?: boolean;
  showBackInFooter?: boolean;
}

const steps = [
  { number: 1, title: 'Industria', description: 'Selecciona tu tipo de negocio' },
  { number: 2, title: 'Organización', description: 'Configura tu empresa' },
  { number: 3, title: 'Configuración', description: 'Personaliza tus preferencias' },
  { number: 4, title: 'Servicios', description: 'Define tus servicios' },
  { number: 5, title: 'Plan', description: 'Elige tu plan de servicio' },
];

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  currentStep,
  totalSteps = 5,
  title,
  subtitle,
  onPreviousStep,
  canGoBack = false,
  showBackInFooter = false
}) => {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-32 max-w-7xl mx-auto">
          <div className="flex items-center justify-between py-2">
            {/* Left: Back + Logo */}
            <div className="flex items-center space-x-4">
              {canGoBack && onPreviousStep && !showBackInFooter && (
                <button
                  onClick={onPreviousStep}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Atrás</span>
                </button>
              )}

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <img src="/miniatura.webp" alt="BookFlow" className="w-5 h-5 object-contain rounded-md" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900 leading-tight">BookFlow</span>
                  <span className="text-xs text-gray-500 leading-tight">Configuración inicial</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
              <span className="font-medium">{currentStep}</span>
              <span>de</span>
              <span className="font-medium">{totalSteps}</span>
            </div>
          </div>

          {/* Steps Progress */}
          <div className="pb-3">
            <div className="flex items-center justify-center mb-3">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      relative flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all duration-300
                      ${currentStep > step.number
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-500 shadow-lg transform scale-105'
                        : currentStep === step.number
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg transform scale-110 ring-4 ring-blue-100'
                          : 'bg-white text-gray-400 border-gray-300 hover:border-gray-400'
                      }
                    `}>
                      {currentStep > step.number ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        step.number
                      )}
                      {currentStep === step.number && (
                        <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20"></div>
                      )}
                    </div>

                    <div className="mt-2 text-center">
                      <div className={`text-xs font-semibold transition-colors duration-300 ${
                        currentStep > step.number
                          ? 'text-green-600'
                          : currentStep === step.number
                            ? 'text-blue-600'
                            : 'text-gray-500'
                      }`}>
                        {step.title}
                      </div>
                      <div className={`text-xs mt-0.5 transition-colors duration-300 ${
                        currentStep >= step.number ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {step.description}
                      </div>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4 mb-6">
                      <div className={`h-1 rounded-full transition-all duration-500 relative overflow-hidden ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {currentStep === step.number + 1 && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Progress */}
            <div className="md:hidden">
              <div className="flex justify-between text-xs text-gray-600 mb-2 font-medium">
                <span>Paso {currentStep} de {totalSteps}</span>
                <span className="text-blue-600">{Math.round((currentStep / totalSteps) * 100)}% completo</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-32 py-3 flex-1 flex flex-col min-h-0 max-w-7xl mx-auto">
          <div className="text-center mb-3 flex-shrink-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 text-sm leading-tight">
                {subtitle}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 xl:p-8 flex-1 min-h-0 overflow-hidden w-full">
            {showBackInFooter && React.isValidElement(children) 
              ? React.cloneElement(children, { 
                  onPreviousStep, 
                  canGoBack,
                  showBackInFooter: true
                } as any)
              : children
            }
          </div>
        </div>

        <div className="text-center py-2 text-xs text-gray-500 flex-shrink-0">
          ¿Necesitas ayuda? <a href="mailto:soporte@bookflow.com" className="text-blue-600 hover:text-blue-700">Contáctanos</a>
        </div>
      </div>
    </div>
  );
};
