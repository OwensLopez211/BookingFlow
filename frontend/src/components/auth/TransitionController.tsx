import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface TransitionControllerProps {
  children: React.ReactNode;
}

export const TransitionController: React.FC<TransitionControllerProps> = ({ children }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPath, setCurrentPath] = useState(location.pathname);

  useEffect(() => {
    if (currentPath !== location.pathname) {
      setIsTransitioning(true);
      
      // Sincronizar el cambio de path con la animación
      const timer = setTimeout(() => {
        setCurrentPath(location.pathname);
        setIsTransitioning(false);
      }, 300); // Mitad de la duración del overlay

      return () => clearTimeout(timer);
    }
  }, [location.pathname, currentPath]);

  const overlayVariants = {
    initial: { scaleX: 0 },
    animate: { scaleX: isTransitioning ? 1 : 0 },
    transition: {
      duration: 0.6,
      ease: [0.32, 0.72, 0, 1]
    }
  };

  return (
    <div className="relative">
      {/* Overlay de transición controlado */}
      <motion.div
        variants={overlayVariants}
        initial="initial"
        animate="animate"
        className="fixed inset-0 bg-gradient-to-r from-emerald-600 to-purple-600 z-50"
        style={{ 
          transformOrigin: 'left',
          willChange: 'transform'
        }}
      />

      {/* Contenido */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPath}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              duration: 0.4,
              ease: 'easeOut',
              delay: isTransitioning ? 0.3 : 0
            }
          }}
          exit={{ 
            opacity: 0, 
            y: -20,
            transition: {
              duration: 0.2,
              ease: 'easeIn'
            }
          }}
          className="relative z-10"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Efecto de brillo sincronizado */}
      {isTransitioning && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ 
            x: '100%', 
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 0.5,
            ease: 'easeInOut',
            delay: 0.1
          }}
          className="fixed inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent z-40 pointer-events-none"
        />
      )}
    </div>
  );
};