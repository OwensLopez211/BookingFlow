import React, { useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { Button } from '../ui/Button';

// Iconos SVG
const IconCreditCard = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const IconCalendar = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconShield = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconWarning = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const IconInfo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface SubscriptionDashboardProps {
  className?: string;
}

export const SubscriptionDashboard: React.FC<SubscriptionDashboardProps> = ({ className = "" }) => {
  const { subscription, oneclickStatus, isLoading, error, actions, helpers } = useSubscription();
  const [isCanceling, setIsCanceling] = useState(false);
  const [isRemovingOneClick, setIsRemovingOneClick] = useState(false);

  const handleCancelSubscription = async () => {
    if (!confirm('¿Estás seguro de que quieres cancelar tu suscripción? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsCanceling(true);
    try {
      await actions.cancelSubscription();
      alert('Suscripción cancelada exitosamente');
    } catch (error) {
      alert('Error cancelando suscripción: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsCanceling(false);
    }
  };

  const handleRemoveOneClick = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar tu método de pago automático? Deberás configurarlo nuevamente para futuros cobros.')) {
      return;
    }

    setIsRemovingOneClick(true);
    try {
      await actions.removeOneClickInscription();
      alert('Método de pago eliminado exitosamente');
    } catch (error) {
      alert('Error eliminando método de pago: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsRemovingOneClick(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <IconWarning className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Error al cargar suscripción</h3>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={actions.refresh} variant="outline" size="sm">
          Reintentar
        </Button>
      </div>
    );
  }

  const displayStatus = helpers.getDisplayStatus();
  const nextBillingDate = helpers.getNextBillingDate();
  const isInTrial = helpers.isInTrial();
  const canCancel = helpers.canCancel();

  const getStatusBadgeClasses = (color: string) => {
    const classes = {
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return classes[color as keyof typeof classes] || classes.gray;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Mi Suscripción</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClasses(displayStatus.color)}`}>
            {displayStatus.status}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">{displayStatus.description}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Plan Information */}
        {subscription && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información del Plan</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Plan:</span>
                  <span className="text-sm font-medium">{subscription.plan.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Precio:</span>
                  <span className="text-sm font-medium">
                    ${subscription.plan.amount.toLocaleString('es-CL')} {subscription.plan.currency}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Frecuencia:</span>
                  <span className="text-sm font-medium">Mensual</span>
                </div>

                {isInTrial && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Días restantes de prueba:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {helpers.getDaysLeftInTrial()} días
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Facturación</h3>
              
              <div className="space-y-3">
                {nextBillingDate && (
                  <div className="flex items-center space-x-3">
                    <IconCalendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">
                        {isInTrial ? 'Primer cobro:' : 'Próximo cobro:'}
                      </div>
                      <div className="text-sm font-medium">
                        {nextBillingDate.toLocaleDateString('es-CL', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {oneclickStatus?.hasOneClick && (
                  <div className="flex items-center space-x-3">
                    <IconCreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Método de pago:</div>
                      <div className="text-sm font-medium">
                        {oneclickStatus.cardType && oneclickStatus.cardNumber ? (
                          <span>
                            {oneclickStatus.cardType === 'AmericanExpress' ? 'American Express' : 
                             oneclickStatus.cardType === 'Visa' ? 'Visa' : 
                             oneclickStatus.cardType === 'Mastercard' ? 'Mastercard' : 
                             oneclickStatus.cardType} 
                             {' '}•••• {oneclickStatus.cardNumber.slice(-4)}
                          </span>
                        ) : (
                          'OneClick configurado'
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* OneClick Status */}
        {oneclickStatus && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pagos Automáticos</h3>
            
            {oneclickStatus.hasOneClick ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <IconShield className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-green-900 mb-1">
                      Pagos automáticos activos
                    </h4>
                    <p className="text-sm text-green-700 mb-3">
                      Tu tarjeta está registrada para cobros automáticos. Los pagos se procesarán automáticamente cada mes.
                    </p>
                    <div className="text-xs text-green-600 space-y-1">
                      {oneclickStatus.cardType && oneclickStatus.cardNumber && (
                        <div className="flex items-center space-x-2">
                          <span>Tarjeta:</span>
                          <span className="font-semibold">
                            {oneclickStatus.cardType === 'AmericanExpress' ? 'AMEX' : 
                             oneclickStatus.cardType === 'Visa' ? 'VISA' : 
                             oneclickStatus.cardType === 'Mastercard' ? 'MC' : 
                             oneclickStatus.cardType} 
                             {' '}•••• {oneclickStatus.cardNumber.slice(-4)}
                          </span>
                        </div>
                      )}
                      <div>Usuario: {oneclickStatus.username}</div>
                      {oneclickStatus.inscriptionDate && (
                        <div>
                          Configurado: {new Date(oneclickStatus.inscriptionDate * 1000).toLocaleDateString('es-CL')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <IconWarning className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900 mb-1">
                      Pagos automáticos no configurados
                    </h4>
                    <p className="text-sm text-yellow-700">
                      Deberás realizar los pagos manualmente cada mes. Te recomendamos configurar un método de pago automático.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trial Information */}
        {isInTrial && (
          <div className="border-t pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <IconInfo className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Período de prueba activo
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Tu período de prueba gratuito termina el{' '}
                    {nextBillingDate?.toLocaleDateString('es-CL', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}.
                  </p>
                  {oneclickStatus?.hasOneClick ? (
                    <p className="text-sm text-blue-700">
                      El primer cobro de ${subscription?.plan.amount.toLocaleString('es-CL')} se realizará automáticamente ese día.
                    </p>
                  ) : (
                    <p className="text-sm text-blue-700">
                      Configura un método de pago para continuar usando el servicio después del período de prueba.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t pt-6">
          <div className="flex flex-wrap gap-3">
            <Button onClick={actions.refresh} variant="outline" size="sm">
              Actualizar información
            </Button>

            {oneclickStatus?.hasOneClick && (
              <Button
                onClick={handleRemoveOneClick}
                variant="outline"
                size="sm"
                disabled={isRemovingOneClick}
              >
                {isRemovingOneClick ? 'Eliminando...' : 'Eliminar método de pago'}
              </Button>
            )}

            {canCancel && (
              <Button
                onClick={handleCancelSubscription}
                variant="outline"
                size="sm"
                disabled={isCanceling}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
              >
                {isCanceling ? 'Cancelando...' : 'Cancelar suscripción'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};