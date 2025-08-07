import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlurText from '@/components/ui/BlurText';
import LightRays from '@/components/ui/LightRays';

interface WelcomeStep {
  id: number;
  component: React.ReactNode;
  duration?: number;
}

export const WelcomeLayout: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const welcomeSteps: WelcomeStep[] = [
    {
      id: 1,
      component: (
        <div className="text-center">
          <BlurText
            text="¡Bienvenido a BookingFlow!"
            delay={250}
            animateBy="words"
            direction="top"
            onAnimationComplete={() => {
              setTimeout(() => {
                setCurrentStep(1);
              }, 2000);
            }}
            className="text-4xl md:text-6xl font-bold text-white mb-8"
          />
        </div>
      ),
      duration: 4000
    },
    {
      id: 2,
      component: (
        <div className="text-center space-y-12">
          <div className="space-y-8">
            <BlurText
              text="Todo lo que necesitas para administrar tu negocio, reunido en una sola plataforma"
              delay={100}
              animateBy="words"
              direction="top"
              className="text-2xl md:text-3xl text-white/90"
            />
            <BlurText
              text="gestionar citas y reservas"
              delay={120}
              animateBy="words"
              direction="bottom"
              className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
            />
          </div>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.5, duration: 0.6 }}
              className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-400/30 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Agenda Inteligente</h3>
              <p className="text-white/60 text-sm">Organiza citas automáticamente con IA</p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.8, duration: 0.6 }}
              className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-400/30 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h3l9-9 3-3-6-6-3 3-9 9v6z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Reportes Avanzados</h3>
              <p className="text-white/60 text-sm">Analytics detallados de tu negocio</p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3.1, duration: 0.6 }}
              className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-400/30 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Notificaciones</h3>
              <p className="text-white/60 text-sm">Recordatorios automáticos para clientes</p>
            </motion.div>
          </motion.div>

          {/* Progress Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5, duration: 0.8 }}
            onAnimationComplete={() => {
              setTimeout(() => {
                setCurrentStep(2);
              }, 3000);
            }}
            className="flex justify-center items-center space-x-4"
          >
            <div className="flex items-center space-x-2 text-white/60">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Configurando tu experiencia...</span>
            </div>
          </motion.div>
        </div>
      ),
      duration: 7000
    },
    {
      id: 3,
      component: (
        <div className="text-center space-y-16">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 200 }}
              className="mx-auto w-24 h-24 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-2xl"
            >
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <div className="space-y-4 text-center">
              <BlurText
                text="¡Todo está listo!"
                delay={100}
                animateBy="words"
                direction="top"
                className="text-3xl md:text-4xl font-bold text-white text-center"
              />
              <BlurText
                text="Tu cuenta ha sido configurada exitosamente"
                delay={150}
                animateBy="words"
                direction="bottom"
                className="text-lg md:text-xl text-white/80 text-center"
              />
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/[0.05] backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <div className="text-2xl font-bold text-emerald-400">0</div>
              <div className="text-white/60 text-sm">Citas</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/[0.05] backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <div className="text-2xl font-bold text-blue-400">1</div>
              <div className="text-white/60 text-sm">Usuario</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/[0.05] backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <div className="text-2xl font-bold text-purple-400">100%</div>
              <div className="text-white/60 text-sm">Configurado</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/[0.05] backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <div className="text-2xl font-bold text-cyan-400">∞</div>
              <div className="text-white/60 text-sm">Posibilidades</div>
            </motion.div>
          </motion.div>

          {/* Primary Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="space-y-6"
          >
            {/* Main CTA */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 hover:from-purple-700 hover:via-violet-700 hover:to-blue-700 text-white px-12 py-5 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-300 relative overflow-hidden group"
              onClick={() => {
                console.log('Ir al Dashboard');
              }}
            >
              <span className="relative z-10 flex items-center justify-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>Comenzar a usar BookFlow</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </motion.button>

            {/* Secondary Options */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="border-2 border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-xl font-semibold backdrop-blur-sm hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2"
                onClick={() => {
                  console.log('Ver Tutorial');
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Tutorial rápido</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="border-2 border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-xl font-semibold backdrop-blur-sm hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2"
                onClick={() => {
                  console.log('Ver Demo');
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ver demo en vivo</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Achievement Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4, duration: 1 }}
            className="flex flex-wrap justify-center gap-6 text-white/50 text-sm max-w-2xl mx-auto"
          >
            <div className="flex items-center space-x-2 bg-white/[0.03] rounded-full px-4 py-2 border border-white/10">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>Cuenta verificada</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/[0.03] rounded-full px-4 py-2 border border-white/10">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Configuración completa</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/[0.03] rounded-full px-4 py-2 border border-white/10">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Listo para usar</span>
            </div>
          </motion.div>

          {/* Celebration Particles */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 2 }}
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: window.innerHeight + 100,
                  rotate: 0,
                  opacity: 0
                }}
                animate={{ 
                  y: -100, 
                  rotate: 360,
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
                className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
              />
            ))}
          </motion.div>
        </div>
      ),
      duration: 0 // No auto-advance
    }
  ];

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const currentStepData = welcomeSteps[currentStep];

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black flex items-center justify-center">
      {/* Background LightRays */}
      <div className="absolute inset-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#4508a1"
          raysSpeed={0.8}
          lightSpread={0.6}
          rayLength={1.8}
          followMouse={true}
          mouseInfluence={0.15}
          noiseAmount={0.1}
          distortion={0.05}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-[60vh]"
          >
            {currentStepData.component}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Step indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {welcomeSteps.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentStep 
                ? 'bg-white scale-125' 
                : index < currentStep 
                  ? 'bg-purple-400' 
                  : 'bg-white/30'
            }`}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </div>

      {/* Skip option */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors duration-300 text-sm"
        onClick={() => {
          // Ir directamente al dashboard
          console.log('Saltar bienvenida');
        }}
      >
        Saltar →
      </motion.button>

      {/* Background overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none"></div>
    </div>
  );
};