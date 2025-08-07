import { motion } from 'framer-motion';
import RoadmapStep from './RoadmapStep';

interface Step {
  id: number;
  title: string;
  description: string;
  isCompleted?: boolean;
  isActive?: boolean;
  icon?: React.ReactNode;
}

interface RoadmapTimelineProps {
  steps: Step[];
}

const RoadmapTimeline = ({ steps }: RoadmapTimelineProps) => {
  return (
    <section className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-24">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[length:32px_32px]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Timeline Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.4, 0.0, 0.2, 1] }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-3 bg-purple-950/30 border border-purple-500/20 px-6 py-3 rounded-full mb-6 backdrop-blur-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-purple-300 font-medium text-sm tracking-wide uppercase">
                Hoja de Ruta 2025-2026
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
              Evolución de la Plataforma
            </h2>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Desde funcionalidades básicas hasta inteligencia artificial avanzada. 
              Cada milestone está diseñado para escalabilidad y crecimiento sostenible.
            </p>

            {/* Progress Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-3xl mx-auto">
              {[
                { label: "Completado", count: steps.filter(s => s.isCompleted).length, color: "text-green-400", bg: "bg-green-950/30", border: "border-green-500/30" },
                { label: "En Desarrollo", count: steps.filter(s => s.isActive).length, color: "text-blue-400", bg: "bg-blue-950/30", border: "border-blue-500/30" },
                { label: "Próximo", count: steps.filter(s => s.isUpcoming).length, color: "text-purple-400", bg: "bg-purple-950/30", border: "border-purple-500/30" },
                { label: "Total", count: steps.length, color: "text-gray-300", bg: "bg-gray-800/30", border: "border-gray-600/30" }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  className={`${item.bg} ${item.border} border rounded-xl p-4 backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
                >
                  <div className={`text-2xl font-bold ${item.color} mb-1`}>
                    {item.count}
                  </div>
                  <div className="text-sm text-gray-400 font-medium">
                    {item.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Timeline container */}
          <div className="relative">
            {/* Main timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/20 via-purple-400/30 to-purple-300/20"></div>
            
            {/* Animated progress line */}
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 2.5, ease: "easeOut", delay: 0.8 }}
              className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-purple-500 via-purple-400 to-purple-300 shadow-lg"
            />

            {/* Timeline start indicator */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5, ease: "backOut" }}
              className="absolute left-3 -top-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center z-10"
            >
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </motion.div>

            {/* Steps */}
            <div className="space-y-12 pt-8">
              {steps.map((step, index) => (
                <RoadmapStep
                  key={step.id}
                  stepNumber={step.id}
                  title={step.title}
                  description={step.description}
                  timeframe={step.timeframe}
                  quarter={step.quarter}
                  clientRequirement={step.clientRequirement}
                  isCompleted={step.isCompleted}
                  isActive={step.isActive}
                  isUpcoming={step.isUpcoming}
                  icon={step.icon}
                  features={step.features}
                />
              ))}
            </div>

            {/* Timeline end indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 2.5, duration: 0.5, ease: "backOut" }}
              className="relative mt-12 flex justify-center"
            >
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center mb-4">
                  <motion.svg
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                  </motion.svg>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm font-medium mb-1">
                    Continuaremos innovando
                  </p>
                  <p className="text-xs text-gray-500">
                    Más funcionalidades por venir...
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapTimeline;