import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { PageTransition } from './PageTransition';

interface AuthTransitionProps {
  children: React.ReactNode;
}

export const AuthTransition: React.FC<AuthTransitionProps> = ({ children }) => {
  const location = useLocation();
  const isLogin = location.pathname === '/auth/login';
  
  // Variantes de animación para el contenedor principal
  const pageVariants = {
    initial: {
      opacity: 0,
    },
    in: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
        delay: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.08
      }
    },
    out: {
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  // Variantes para el panel lateral (hero section)
  // Login: hero izquierda, Register: hero derecha
  const heroVariants = {
    initial: {
      x: isLogin ? -50 : 50, // Login viene desde izquierda, Register desde derecha
      opacity: 0,
    },
    in: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.32, 0.72, 0, 1],
        delay: 0
      }
    },
    out: {
      x: isLogin ? -50 : 50, // Login sale hacia izquierda, Register hacia derecha
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.32, 0.72, 0, 1]
      }
    }
  };

  // Variantes para el formulario
  // Login: form derecha, Register: form izquierda (invertido)
  const formVariants = {
    initial: {
      x: isLogin ? 50 : -50, // Login viene desde derecha, Register desde izquierda
      opacity: 0,
    },
    in: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.32, 0.72, 0, 1],
        delay: 0.08
      }
    },
    out: {
      x: isLogin ? 50 : -50, // Login sale hacia derecha, Register hacia izquierda
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.32, 0.72, 0, 1]
      }
    }
  };

  // Variantes para elementos decorativos
  const decorativeVariants = {
    initial: {
      scale: 0.8,
      opacity: 0,
    },
    in: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.32, 0.72, 0, 1],
        delay: 0.16
      }
    },
    out: {
      scale: 0.8,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  return (
    <AnimatePresence 
      mode="wait"
      onExitComplete={() => {
        // Asegurar que el DOM se limpie antes de la siguiente animación
        window.scrollTo(0, 0);
      }}
    >
      <PageTransition key={location.pathname}>
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
          className="min-h-screen"
          style={{ willChange: 'opacity' }}
        >
          {React.cloneElement(children as React.ReactElement, {
            heroVariants,
            formVariants,
            decorativeVariants
          })}
        </motion.div>
      </PageTransition>
    </AnimatePresence>
  );
};