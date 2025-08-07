import { motion } from 'framer-motion';

const RoadmapHero = () => {
  return (
    <section className="relative bg-white dark:bg-gray-950 min-h-screen flex items-center justify-center overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-50"></div>
        
        {/* Gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-radial from-blue-500/10 to-transparent rounded-full blur-3xl"
        />
        
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-radial from-purple-500/10 to-transparent rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 py-20 text-center relative z-10">
        <div className="max-w-5xl mx-auto">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }}
            className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-400 mb-8 backdrop-blur-sm"
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Roadmap 2025-2026
          </motion.div>

          {/* Main heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.4, 0.0, 0.2, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight leading-[1.1]"
          >
            El Futuro de{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BookFlow
              </span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full origin-left"
              />
            </span>
          </motion.h1>
          
          {/* Description */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Descubre las innovaciones que transformarán la gestión de citas. 
            Cada funcionalidad está diseñada para impulsar tu crecimiento y optimizar tu operación.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.button
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 10px 30px rgba(59, 130, 246, 0.15)"
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg overflow-hidden transition-colors duration-200"
            >
              <span className="relative z-10 flex items-center gap-2">
                Ver Funcionalidades
                <motion.svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>

            <motion.button
              whileHover={{ 
                scale: 1.02,
                backgroundColor: "rgba(0, 0, 0, 0.05)"
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="px-8 py-4 bg-transparent border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200"
            >
              Comenzar Gratis
            </motion.button>
          </motion.div>

          {/* Minimal 3D Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 1, ease: [0.4, 0.0, 0.2, 1] }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="relative">
              
              {/* Main illustration container */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm rounded-3xl border border-gray-200 dark:border-gray-700/50 p-12 shadow-2xl">
                
                {/* Central calendar/dashboard */}
                <motion.div 
                  animate={{ 
                    y: [0, -8, 0],
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="relative mx-auto w-80 h-52 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Dashboard header */}
                  <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Dashboard content */}
                  <div className="absolute inset-0 pt-12 p-4">
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {Array.from({ length: 21 }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.2 + i * 0.05, duration: 0.3 }}
                          className={`h-4 rounded-sm ${
                            [2, 8, 15, 18].includes(i) 
                              ? 'bg-blue-500' 
                              : [5, 12].includes(i)
                                ? 'bg-purple-500'
                                : 'bg-gray-100 dark:bg-gray-800'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Stats bars */}
                    <div className="space-y-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "75%" }}
                        transition={{ delay: 1.5, duration: 1, ease: "easeOut" }}
                        className="h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "60%" }}
                        transition={{ delay: 1.7, duration: 1, ease: "easeOut" }}
                        className="h-2 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "90%" }}
                        transition={{ delay: 1.9, duration: 1, ease: "easeOut" }}
                        className="h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Floating feature cards */}
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 2, 0]
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute -top-4 -left-8 w-24 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 transform -rotate-12"
                >
                  <div className="w-full h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full mb-2"></div>
                  <div className="w-3/4 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                </motion.div>

                <motion.div
                  animate={{ 
                    y: [0, 12, 0],
                    rotate: [0, -3, 0]
                  }}
                  transition={{ 
                    duration: 7, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: 2
                  }}
                  className="absolute -bottom-2 -right-6 w-28 h-18 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 transform rotate-6"
                >
                  <div className="w-full h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mb-2"></div>
                  <div className="w-2/3 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mb-1"></div>
                  <div className="w-4/5 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                </motion.div>

                {/* Subtle particles */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.3, 0.7, 0.3],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.5
                    }}
                    className="absolute w-1 h-1 bg-blue-400 rounded-full"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${30 + Math.sin(i) * 20}%`
                    }}
                  />
                ))}
              </div>

              {/* Bottom label */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 0.6 }}
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
              >
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-full shadow-lg">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Gestión Inteligente de Citas
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Progress indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.8 }}
            className="flex justify-center items-center space-x-2 mt-16"
          >
            <div className="text-sm text-gray-500 dark:text-gray-400 mr-4">Progreso del desarrollo</div>
            {[1, 2, 3, 4, 5].map((_, i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className={`w-2 h-2 rounded-full ${
                  i < 2 ? 'bg-green-500' : i < 3 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
            <div className="text-sm text-gray-500 dark:text-gray-400 ml-4">2/9 completo</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapHero;