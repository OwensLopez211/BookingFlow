import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
  onComplete?: () => void;
}

const LoadingScreen = ({ isLoading, onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    'Iniciando aplicación',
    'Configurando dashboard',
    'Cargando datos',
    'Finalizando'
  ];

  useEffect(() => {
    if (!isLoading) return;

    let progressValue = 0;
    let stepIndex = 0;

    const progressInterval = setInterval(() => {
      // Smoother, more realistic progress increment
      const increment = Math.random() * 8 + 2;
      progressValue += increment;
      
      if (progressValue >= 100) {
        progressValue = 100;
        setProgress(100);
        setCurrentStep(loadingSteps.length - 1);
        clearInterval(progressInterval);
        
        // Shorter delay for better UX
        setTimeout(() => {
          onComplete?.();
        }, 300);
        return;
      }

      setProgress(progressValue);

      // Update step based on progress
      const newStepIndex = Math.min(
        Math.floor((progressValue / 100) * loadingSteps.length),
        loadingSteps.length - 1
      );
      
      if (newStepIndex !== stepIndex) {
        stepIndex = newStepIndex;
        setCurrentStep(stepIndex);
      }
    }, 150); // Faster update for smoother animation

    return () => clearInterval(progressInterval);
  }, [isLoading, onComplete]);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { 
              duration: 0.4,
              ease: [0.4, 0.0, 0.2, 1]
            }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-950"
          role="status"
          aria-live="polite"
          aria-label="Cargando aplicación"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:32px_32px] opacity-50" />

          {/* Main Content Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6,
              ease: [0.4, 0.0, 0.2, 1]
            }}
            className="relative flex flex-col items-center space-y-8 px-4"
          >
            {/* Logo Container - Clean and Simple */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.5,
                ease: [0.4, 0.0, 0.2, 1]
              }}
              className="relative"
            >
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                {/* Logo Image */}
                <img 
                  src="/miniatura.webp" 
                  alt="BookFlow" 
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                
                {/* Fallback Icon - Calendar */}
                <svg 
                  className="w-12 h-12 sm:w-14 sm:h-14 text-blue-600 dark:text-blue-400 hidden" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
              </div>
            </motion.div>

            {/* Elegant Spinner */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="relative"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full"
                aria-hidden="true"
              />
            </motion.div>

            {/* Brand Name - Clean Typography */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center space-y-3"
            >
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
                BookFlow
              </h1>
              
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-gray-600 dark:text-gray-400 text-base font-medium"
              >
                {loadingSteps[currentStep]}
              </motion.p>
            </motion.div>

            {/* Minimal Progress Bar */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-64 sm:w-80 max-w-sm"
            >
              <div className="relative h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-blue-600 dark:bg-blue-400 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ 
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                />
              </div>
              
              {/* Progress Percentage - Only show when significant progress */}
              {progress > 10 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center mt-3 text-gray-500 dark:text-gray-400 text-sm tabular-nums"
                >
                  {Math.floor(progress)}%
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Minimal Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute bottom-6 text-gray-400 dark:text-gray-500 text-xs font-medium"
          >
            Sistema de gestión de citas
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;