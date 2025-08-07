import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ 
  password, 
  className = '' 
}) => {
  const requirements: PasswordRequirement[] = [
    {
      label: 'Al menos 8 caracteres',
      test: (pwd) => pwd.length >= 8,
      met: password.length >= 8
    },
    {
      label: 'Una letra mayúscula',
      test: (pwd) => /[A-Z]/.test(pwd),
      met: /[A-Z]/.test(password)
    },
    {
      label: 'Una letra minúscula', 
      test: (pwd) => /[a-z]/.test(pwd),
      met: /[a-z]/.test(password)
    },
    {
      label: 'Un número',
      test: (pwd) => /\d/.test(pwd),
      met: /\d/.test(password)
    },
    {
      label: 'Un carácter especial',
      test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  // Solo mostrar si hay algo escrito en la contraseña
  if (!password.trim()) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`mt-3 ${className}`}
    >
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Requisitos de contraseña:
        </h4>
        
        <div className="space-y-2">
          {requirements.map((req, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex items-center space-x-2"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ 
                  scale: 1,
                  backgroundColor: req.met ? '#10b981' : '#ef4444'
                }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
              >
                {req.met ? (
                  <CheckIcon className="w-3 h-3 text-white" />
                ) : (
                  <XMarkIcon className="w-3 h-3 text-white" />
                )}
              </motion.div>
              
              <span className={`text-sm transition-colors duration-200 ${
                req.met 
                  ? 'text-emerald-700 dark:text-emerald-400 font-medium' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {req.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};