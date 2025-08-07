import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLogin = location.pathname === '/auth/login';
  return (
    <div className="relative">
      {/* Overlay de transición - Entrada */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.32, 0.72, 0, 1],
          delay: 0
        }}
        className={`fixed inset-0 z-50 ${
          isLogin 
            ? 'bg-gradient-to-r from-purple-600 to-emerald-600' 
            : 'bg-gradient-to-l from-emerald-600 to-purple-600'
        }`}
        style={{ 
          transformOrigin: isLogin ? 'left' : 'right',
          willChange: 'transform'
        }}
      />

      {/* Overlay de transición - Salida */}
      <motion.div
        initial={{ scaleX: 0 }}
        exit={{ scaleX: 1 }}
        transition={{
          duration: 0.4,
          ease: [0.32, 0.72, 0, 1],
          delay: 0
        }}
        className={`fixed inset-0 z-50 ${
          isLogin
            ? 'bg-gradient-to-l from-emerald-600 to-purple-600'
            : 'bg-gradient-to-r from-purple-600 to-emerald-600'
        }`}
        style={{ 
          transformOrigin: isLogin ? 'right' : 'left',
          willChange: 'transform'
        }}
      />
      
      {/* Contenido con timing perfecto */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.2,
          ease: 'easeOut',
          delay: 0.25  // Aparece cuando el overlay está a la mitad
        }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};