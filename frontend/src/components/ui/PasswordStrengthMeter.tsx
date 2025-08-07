import React from 'react';
import { motion } from 'framer-motion';

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

interface PasswordStrengthConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

const strengthConfigs: Record<PasswordStrength, PasswordStrengthConfig> = {
  'weak': {
    label: 'Muy débil',
    color: '#ef4444',
    bgColor: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400'
  },
  'fair': {
    label: 'Débil',
    color: '#f97316',
    bgColor: 'bg-orange-500',
    textColor: 'text-orange-600 dark:text-orange-400'
  },
  'good': {
    label: 'Buena',
    color: '#eab308',
    bgColor: 'bg-yellow-500',
    textColor: 'text-yellow-600 dark:text-yellow-400'
  },
  'strong': {
    label: 'Fuerte',
    color: '#22c55e',
    bgColor: 'bg-green-500',
    textColor: 'text-green-600 dark:text-green-400'
  },
  'very-strong': {
    label: 'Muy fuerte',
    color: '#10b981',
    bgColor: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400'
  }
};

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ 
  password, 
  className = '' 
}) => {
  
  const calculateStrength = (password: string): { strength: PasswordStrength; score: number } => {
    if (!password) return { strength: 'weak', score: 0 };
    
    let score = 0;
    const checks = [
      password.length >= 8, // longitud mínima
      password.length >= 12, // longitud buena
      /[a-z]/.test(password), // minúsculas
      /[A-Z]/.test(password), // mayúsculas
      /\d/.test(password), // números
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), // especiales
      password.length >= 16, // longitud excelente
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password) // combinación completa
    ];
    
    score = checks.filter(Boolean).length;
    
    if (score <= 2) return { strength: 'weak', score };
    if (score <= 4) return { strength: 'fair', score };
    if (score <= 5) return { strength: 'good', score };
    if (score <= 6) return { strength: 'strong', score };
    return { strength: 'very-strong', score };
  };

  const { strength, score } = calculateStrength(password);
  const config = strengthConfigs[strength];
  const percentage = Math.max(0, Math.min(100, (score / 8) * 100));

  // Solo mostrar si hay algo escrito
  if (!password.trim()) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`mt-3 ${className}`}
    >
      <div className="space-y-2">
        {/* Label */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Seguridad de contraseña
          </span>
          <span className={`text-sm font-semibold ${config.textColor}`}>
            {config.label}
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${percentage}%`,
              backgroundColor: config.color
            }}
            transition={{ 
              duration: 0.5, 
              ease: 'easeOut'
            }}
            className="h-full rounded-full"
          />
          
          {/* Efecto de brillo */}
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ 
              x: percentage > 0 ? '100%' : '-100%', 
              opacity: percentage > 0 ? [0, 1, 0] : 0
            }}
            transition={{ 
              duration: 1.2, 
              ease: 'easeInOut',
              repeat: percentage > 0 ? Infinity : 0,
              repeatDelay: 2
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </div>

        {/* Indicadores de nivel */}
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((level) => {
            const isActive = score >= level * 1.6;
            return (
              <motion.div
                key={level}
                initial={{ scale: 0.8, opacity: 0.3 }}
                animate={{ 
                  scale: isActive ? 1 : 0.8,
                  opacity: isActive ? 1 : 0.3,
                  backgroundColor: isActive ? config.color : '#d1d5db'
                }}
                transition={{ duration: 0.2, delay: level * 0.05 }}
                className="flex-1 h-1 rounded-full"
              />
            );
          })}
        </div>

        {/* Consejos */}
        {strength === 'weak' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-500 dark:text-gray-400 mt-1"
          >
            💡 Usa una combinación de letras, números y símbolos
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};