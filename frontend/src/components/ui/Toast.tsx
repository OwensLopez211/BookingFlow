import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onRemove: (id: string) => void;
}

interface ToastConfig {
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  titleColor: string;
  messageColor: string;
}

const toastConfigs: Record<ToastType, ToastConfig> = {
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-900 dark:text-emerald-100',
    messageColor: 'text-emerald-700 dark:text-emerald-200'
  },
  error: {
    icon: XCircleIcon,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-500',
    titleColor: 'text-red-900 dark:text-red-100',
    messageColor: 'text-red-700 dark:text-red-200'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-900 dark:text-yellow-100',
    messageColor: 'text-yellow-700 dark:text-yellow-200'
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-900 dark:text-blue-100',
    messageColor: 'text-blue-700 dark:text-blue-200'
  }
};

export const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onRemove 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = toastConfigs[type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(id), 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onRemove]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsVisible(false);
    setTimeout(() => onRemove(id), 200);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`
            relative flex items-start p-4 mb-3 rounded-lg border shadow-lg backdrop-blur-sm
            ${config.bgColor} ${config.borderColor}
            max-w-sm w-full
          `}
        >
          {/* Icono */}
          <div className="flex-shrink-0">
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>

          {/* Contenido */}
          <div className="ml-3 flex-1">
            <h4 className={`text-sm font-semibold ${config.titleColor}`}>
              {title}
            </h4>
            {message && (
              <p className={`text-sm mt-1 ${config.messageColor}`}>
                {message}
              </p>
            )}
          </div>

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={handleClose}
            className={`
              flex-shrink-0 ml-3 p-1 rounded-full transition-colors
              hover:bg-gray-200 dark:hover:bg-gray-700
              ${config.iconColor} hover:opacity-70
            `}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>

          {/* Barra de progreso */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className={`
              absolute bottom-0 left-0 h-1 rounded-b-lg origin-left
              ${config.iconColor.replace('text-', 'bg-')}
            `}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};