import React from 'react';
import { ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTrialStatus } from '@/hooks/useTrialStatus';

export const TrialStatusBadge: React.FC = () => {
  const { trialStatus } = useTrialStatus();

  // Si no hay trial activo o no está configurado, no mostrar nada
  if (trialStatus.subscriptionStatus === 'no-trial' || trialStatus.subscriptionStatus === null) {
    return null;
  }

  // Si el trial expiró hace mucho, no mostrar
  if (trialStatus.subscriptionStatus === 'expired' && trialStatus.daysRemaining === 0) {
    return null;
  }

  const { daysRemaining, isInTrial } = trialStatus;

  // Determinar el color y el icono basado en los días restantes
  const getStatusStyle = () => {
    if (trialStatus.subscriptionStatus === 'expired' || (!isInTrial && daysRemaining === 0)) {
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
        icon: ExclamationTriangleIcon,
        label: 'Trial expirado'
      };
    } else if (daysRemaining <= 3) {
      return {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-600',
        icon: ClockIcon,
        label: `${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
      };
    } else if (daysRemaining <= 7) {
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600',
        icon: ClockIcon,
        label: `${daysRemaining} días restantes`
      };
    } else {
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        iconColor: 'text-green-600',
        icon: CheckCircleIcon,
        label: `${daysRemaining} días restantes`
      };
    }
  };

  const status = getStatusStyle();
  const Icon = status.icon;

  return (
    <div className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg ${status.bgColor} ${status.textColor} text-xs font-medium transition-all duration-200 hover:scale-105`}>
      <Icon className={`h-3.5 w-3.5 ${status.iconColor}`} />
      <span className="whitespace-nowrap">{status.label}</span>
    </div>
  );
};

export default TrialStatusBadge;