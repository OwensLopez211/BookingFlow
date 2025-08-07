import React from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ServiceUnavailableProps {
  serviceName?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ServiceUnavailable: React.FC<ServiceUnavailableProps> = ({ 
  serviceName = 'servicio',
  onRetry,
  showRetry = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4"
      >
        <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
      >
        {serviceName} no disponible
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-gray-600 dark:text-gray-400 mb-6 max-w-md"
      >
        El {serviceName} no está disponible en este momento. 
        Por favor, inténtalo más tarde o contacta con el administrador.
      </motion.p>

      {showRetry && onRetry && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          onClick={onRetry}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Reintentar</span>
        </motion.button>
      )}
    </motion.div>
  );
};