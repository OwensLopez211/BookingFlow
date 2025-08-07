import { motion } from 'framer-motion';

interface RoadmapStepProps {
  stepNumber: number;
  title: string;
  description: string;
  timeframe: string;
  quarter: string;
  clientRequirement?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  isUpcoming?: boolean;
  icon?: React.ReactNode;
  features?: string[];
}

const RoadmapStep = ({ 
  stepNumber, 
  title, 
  description,
  timeframe,
  quarter,
  clientRequirement,
  isCompleted = false, 
  isActive = false,
  isUpcoming = false,
  icon,
  features = []
}: RoadmapStepProps) => {
  const getStatusStyles = () => {
    if (isCompleted) {
      return {
        circleClass: 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg',
        cardClass: 'bg-gradient-to-br from-green-950/30 to-green-900/20 border-green-500/30',
        dotColor: 'bg-green-400'
      };
    }
    if (isActive) {
      return {
        circleClass: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg',
        cardClass: 'bg-gradient-to-br from-blue-950/30 to-blue-900/20 border-blue-500/30',
        dotColor: 'bg-blue-400'
      };
    }
    if (isUpcoming) {
      return {
        circleClass: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg',
        cardClass: 'bg-gradient-to-br from-purple-950/30 to-purple-900/20 border-purple-500/30',
        dotColor: 'bg-purple-400'
      };
    }
    return {
      circleClass: 'bg-gray-800 border-2 border-gray-600 text-gray-400',
      cardClass: 'bg-gray-900/50 border-gray-700/50',
      dotColor: 'bg-gray-400'
    };
  };

  const styles = getStatusStyles();

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 0.6, 
        delay: stepNumber * 0.1,
        ease: [0.4, 0.0, 0.2, 1] 
      }}
      className="relative flex items-start group"
    >
      {/* Timeline line connector */}
      <div className="absolute left-6 top-16 w-0.5 h-32 bg-gradient-to-b from-purple-500/40 to-purple-500/10"></div>
      
      {/* Step indicator */}
      <div className="flex-shrink-0 relative">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className={`w-12 h-12 rounded-full flex items-center justify-center relative ${styles.circleClass} transition-all duration-300`}
        >
          {isCompleted ? (
            <motion.svg 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: "backOut" }}
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </motion.svg>
          ) : icon ? (
            <div className="w-5 h-5 text-current">
              {icon}
            </div>
          ) : (
            <span className="text-sm font-bold">{stepNumber}</span>
          )}
          
          {/* Glow effect for active step */}
          {isActive && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-blue-400 rounded-full blur-md -z-10"
            />
          )}
        </motion.div>
        
        {/* Quarter/Timeline label */}
        <div className="absolute -left-8 top-14 text-xs text-purple-400 font-mono bg-purple-950/50 px-2 py-1 rounded border border-purple-500/30 backdrop-blur-sm">
          {quarter}
        </div>
      </div>

      {/* Content */}
      <div className="ml-6 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: stepNumber * 0.1 + 0.2, duration: 0.5 }}
          className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-lg ${styles.cardClass}`}
        >
          {/* Header with title and timeframe */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                {title}
                {isCompleted && (
                  <motion.span
                    initial={{ scale: 0, x: -10 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30 font-medium"
                  >
                    ✓ COMPLETO
                  </motion.span>
                )}
                {isActive && (
                  <motion.span
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 font-medium"
                  >
                    🚧 EN DESARROLLO
                  </motion.span>
                )}
                {isUpcoming && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30 font-medium">
                    📅 PRÓXIMO
                  </span>
                )}
              </h3>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="text-sm text-gray-300 font-medium bg-gray-800/50 px-3 py-1 rounded-full border border-gray-600/30">
                {timeframe}
              </div>
              {clientRequirement && (
                <div className="text-sm text-purple-300 font-medium bg-purple-900/30 px-3 py-1 rounded-full border border-purple-500/30">
                  {clientRequirement}
                </div>
              )}
            </div>
          </div>
          
          <p className="text-gray-300 leading-relaxed mb-5 text-base">
            {description}
          </p>

          {/* Features list */}
          {features.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></span>
                Características incluidas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="flex items-center text-sm text-gray-300 bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-700/50"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mr-3 ${styles.dotColor} flex-shrink-0`}></div>
                    <span className="leading-relaxed">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RoadmapStep;