import { motion } from 'framer-motion';
import { useState } from 'react';

const FeaturesSection = () => {
  const [activeTab, setActiveTab] = useState(0);

  const mainFeatures = [
    {
      id: 'smart-booking',
      title: 'Sistema de Reservas Inteligente',
      description: 'Automatiza la gestión de citas y optimización en tiempo real',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      demo: {
        type: 'calendar',
        stats: [
          { label: 'Citas programadas', value: '2,847', trend: '+12%' },
          { label: 'Tiempo ahorrado', value: '45h/sem', trend: '+28%' },
          { label: 'Satisfacción cliente', value: '96%', trend: '+8%' }
        ]
      }
    },
    {
      id: 'automation',
      title: 'Automatización Completa',
      description: 'Notificaciones automáticas, recordatorios y seguimiento sin intervención manual',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      demo: {
        type: 'automation',
        flows: [
          { step: '01', title: 'Cliente reserva cita', status: 'completed' },
          { step: '02', title: 'Confirmación automática', status: 'completed' },
          { step: '03', title: 'Recordatorio 24h antes', status: 'active' },
          { step: '04', title: 'Follow-up post-cita', status: 'pending' }
        ]
      }
    },
    {
      id: 'payments',
      title: 'Pagos y Facturación',
      description: 'Integración completa con Oneclick para pagos seguros y facturación automática',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      demo: {
        type: 'payments',
        transactions: [
          { id: 'TXN-001', client: 'María García', amount: '$45.000', status: 'completed', method: 'Oneclick' },
          { id: 'TXN-002', client: 'Juan Pérez', amount: '$30.000', status: 'processing', method: 'Oneclick' },
          { id: 'TXN-003', client: 'Ana López', amount: '$60.000', status: 'pending', method: 'Oneclick' }
        ],
        stats: { total: '$2.4M', monthly: '+15%', conversion: '98.5%' }
      }
    },
    {
      id: 'analytics',
      title: 'Analytics y Reportes',
      description: 'Insights profundos y métricas en tiempo real para optimizar tu negocio',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      demo: {
        type: 'analytics',
        metrics: [
          { name: 'Ingresos', value: 450000, change: 12.5, period: 'mes' },
          { name: 'Clientes activos', value: 1240, change: 8.3, period: 'mes' },
          { name: 'Tasa conversión', value: 94.2, change: 2.1, period: 'mes' },
          { name: 'Tiempo promedio', value: 45, change: -5.2, period: 'min' }
        ]
      }
    },
    {
      id: 'mobile',
      title: 'Apps Móviles Nativas',
      description: 'Gestiona tu negocio desde cualquier lugar con nuestras apps iOS y Android',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      demo: {
        type: 'mobile',
        features: [
          { name: 'Notificaciones Push', description: 'Alertas instantáneas', icon: '🔔' },
          { name: 'Modo Offline', description: 'Funciona sin internet', icon: '📱' },
          { name: 'Sincronización', description: 'Datos en tiempo real', icon: '🔄' },
          { name: 'Cámara integrada', description: 'Captura documentos', icon: '📸' }
        ],
        downloads: '25K+',
        rating: '4.9'
      }
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }
    }
  };

  return (
    <section className="relative py-16 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.02)_25%,transparent_25%),linear-gradient(-45deg,rgba(0,0,0,0.02)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,rgba(0,0,0,0.02)_75%),linear-gradient(-45deg,transparent_75%,rgba(0,0,0,0.02)_75%)] bg-[length:60px_60px] bg-[position:0_0,0_30px,30px_-30px,-30px_0px]"></div>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 px-4 py-2 rounded-full text-blue-700 font-semibold text-sm mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            CARACTERÍSTICAS
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Automatiza tu negocio{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                completamente
              </span>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full origin-left"
              />
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Gestiona citas, clientes y pagos con inteligencia artificial. 
            Automatiza recordatorios y optimiza tu agenda para maximizar ingresos.
          </p>
        </motion.div>

        {/* Main Features Tabs */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto">
            {/* Tab Buttons */}
            <div className="xl:w-1/3">
              <div className="space-y-3">
                {mainFeatures.map((feature, index) => (
                  <motion.button
                    key={feature.id}
                    onClick={() => setActiveTab(index)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                      activeTab === index
                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        activeTab === index 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      } transition-colors duration-300`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-base mb-1 ${
                          activeTab === index ? 'text-blue-900' : 'text-gray-900'
                        } transition-colors duration-300`}>
                          {feature.title}
                        </h3>
                        <p className={`text-xs leading-relaxed ${
                          activeTab === index ? 'text-blue-700' : 'text-gray-600'
                        } transition-colors duration-300`}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Demo Area */}
            <div className="xl:w-2/3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 h-[600px] overflow-hidden"
              >
                {activeTab === 0 ? (
                  // Enhanced Calendar Demo
                  <div className="space-y-6">
                    {/* Header with live indicator and controls */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900">Dashboard de Citas</h4>
                          <p className="text-sm text-gray-500">Enero 2025</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-700">En vivo</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Calendar Grid */}
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-200 shadow-inner">
                      {/* Calendar Header */}
                      <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2 bg-white rounded-lg shadow-sm">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-1 mb-3">
                        {Array.from({length: 28}).map((_, i) => {
                          const dayNumber = i + 1;
                          const isToday = dayNumber === 15;
                          const hasAppointments = [4, 8, 15, 22].includes(i);
                          const isHighDemand = [10, 17, 24].includes(i);
                          const isAvailable = [1, 9, 16, 23].includes(i);
                          
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.02, duration: 0.3 }}
                              whileHover={{ scale: 1.05, y: -2 }}
                              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs cursor-pointer transition-all duration-200 group ${
                                isToday
                                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold shadow-lg ring-2 ring-blue-300'
                                  : hasAppointments
                                    ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white font-semibold shadow-md hover:shadow-lg'
                                    : isHighDemand
                                      ? 'bg-gradient-to-br from-purple-400 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg'
                                      : isAvailable
                                        ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-800 font-medium hover:from-green-200 hover:to-green-300'
                                        : dayNumber <= 28
                                          ? 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm'
                                          : 'bg-transparent'
                              }`}
                            >
                              {dayNumber <= 28 && (
                                <>
                                  <span className={`${isToday ? 'text-sm' : 'text-xs'} font-medium`}>
                                    {dayNumber}
                                  </span>
                                  
                                  {/* Appointment indicators */}
                                  {hasAppointments && (
                                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                                      <div className="w-1.5 h-1.5 bg-white/80 rounded-full"></div>
                                      <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                                    </div>
                                  )}
                                  
                                  {isHighDemand && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                  )}
                                  
                                  {isToday && (
                                    <motion.div
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                      className="absolute inset-0 bg-white/20 rounded-xl"
                                    ></motion.div>
                                  )}
                                  
                                  {/* Hover tooltip */}
                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                    {hasAppointments ? '6 citas' : isHighDemand ? 'Alta demanda' : isAvailable ? 'Disponible' : 'Sin citas'}
                                  </div>
                                </>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                      
                      {/* Legend */}
                      <div className="flex items-center justify-center gap-6 mt-4 p-3 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
                          <span className="text-xs text-gray-600 font-medium">Hoy</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full"></div>
                          <span className="text-xs text-gray-600 font-medium">Con citas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full"></div>
                          <span className="text-xs text-gray-600 font-medium">Alta demanda</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-br from-green-100 to-green-200 rounded-full"></div>
                          <span className="text-xs text-gray-600 font-medium">Disponible</span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      {mainFeatures[0].demo.stats.map((stat, index) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                          whileHover={{ y: -2, scale: 1.02 }}
                          className="relative text-center p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          <div className="relative z-10">
                            <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                              {stat.value}
                            </div>
                            <div className="text-xs text-gray-600 mb-1 font-medium">{stat.label}</div>
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                              </svg>
                              {stat.trend}
                            </div>
                          </div>
                          
                          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full"></div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : activeTab === 1 ? (
                  // Enhanced Automation Flow Demo
                  <div className="space-y-6">
                    {/* Enhanced Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900">Flujo de Automatización</h4>
                          <p className="text-sm text-gray-500">Proceso en tiempo real</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-blue-700">Procesando</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">3/4</span> completos
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Flow Container */}
                    <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                      {/* Progress Line */}
                      <div className="absolute left-8 top-16 bottom-16 w-0.5 bg-gray-200"></div>
                      <motion.div
                        initial={{ height: '0%' }}
                        animate={{ height: '65%' }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute left-8 top-16 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"
                      ></motion.div>

                      <div className="space-y-6">
                        {mainFeatures[1].demo.flows.map((flow, index) => (
                          <motion.div
                            key={flow.step}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.2, duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
                            className="relative flex items-start gap-6"
                          >
                            {/* Step Circle */}
                            <div className="relative z-10 flex-shrink-0">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.2 + 0.3, duration: 0.4, type: "spring" }}
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg relative ${
                                  flow.status === 'completed'
                                    ? 'bg-gradient-to-br from-green-400 to-green-500 text-white'
                                    : flow.status === 'active'
                                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                                      : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600'
                                }`}
                              >
                                {flow.status === 'completed' ? (
                                  <motion.svg
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: index * 0.2 + 0.5, duration: 0.4 }}
                                    className="w-5 h-5" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </motion.svg>
                                ) : flow.status === 'active' ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-5 h-5"
                                  >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  </motion.div>
                                ) : (
                                  flow.step
                                )}
                                
                                {/* Glow effect for active */}
                                {flow.status === 'active' && (
                                  <motion.div
                                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-blue-400 rounded-full blur-md -z-10"
                                  ></motion.div>
                                )}
                              </motion.div>
                            </div>

                            {/* Content Card */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.2 + 0.4, duration: 0.4 }}
                              className={`flex-1 p-5 rounded-2xl border-2 transition-all duration-300 ${
                                flow.status === 'completed' 
                                  ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 shadow-lg shadow-green-100'
                                  : flow.status === 'active'
                                    ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50/50 shadow-lg shadow-blue-100'
                                    : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className={`font-semibold text-lg ${
                                  flow.status === 'completed' 
                                    ? 'text-green-900'
                                    : flow.status === 'active'
                                      ? 'text-blue-900'
                                      : 'text-gray-700'
                                }`}>
                                  {flow.title}
                                </h5>
                                
                                {/* Status Badge */}
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  flow.status === 'completed'
                                    ? 'bg-green-200 text-green-800'
                                    : flow.status === 'active'
                                      ? 'bg-blue-200 text-blue-800'
                                      : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {flow.status === 'completed' ? 'Completado' : flow.status === 'active' ? 'En proceso' : 'Pendiente'}
                                </div>
                              </div>
                              
                              {/* Progress details */}
                              <div className="space-y-2">
                                {flow.status === 'completed' && (
                                  <div className="flex items-center gap-2 text-sm text-green-700">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Completado en 0.3s</span>
                                  </div>
                                )}
                                
                                {flow.status === 'active' && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-blue-700">
                                      <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="w-2 h-2 bg-blue-500 rounded-full"
                                      ></motion.div>
                                      <span>Ejecutándose ahora...</span>
                                    </div>
                                    <div className="w-full bg-blue-100 rounded-full h-2">
                                      <motion.div
                                        animate={{ width: ['30%', '70%', '30%'] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                      ></motion.div>
                                    </div>
                                  </div>
                                )}
                                
                                {flow.status === 'pending' && (
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>En espera...</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Next Automation Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1, duration: 0.5 }}
                      className="relative p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl border border-blue-200 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-semibold text-blue-900">Próxima automatización</h5>
                              <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-semibold rounded-full"
                              >
                                Programada
                              </motion.div>
                            </div>
                            <p className="text-sm text-blue-700 leading-relaxed mb-3">
                              El sistema enviará automáticamente una encuesta de satisfacción 2 horas después de la cita
                            </p>
                            <div className="flex items-center gap-4 text-xs text-blue-600">
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>En 2 horas</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2m-6 0h8m-8 0a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2" />
                                </svg>
                                <span>Encuesta de satisfacción</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ) : activeTab === 2 ? (
                  // Payments Demo
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Panel de Pagos</h4>
                          <p className="text-sm text-gray-500">Transacciones en tiempo real</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">$2.4M</div>
                        <div className="text-sm text-gray-500">Total procesado</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {mainFeatures[2].demo.transactions.map((tx, index) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.4 }}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                            tx.status === 'completed' ? 'border-green-200 bg-green-50' :
                            tx.status === 'processing' ? 'border-blue-200 bg-blue-50' :
                            'border-orange-200 bg-orange-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.status === 'completed' ? 'bg-green-500' :
                              tx.status === 'processing' ? 'bg-blue-500' : 'bg-orange-500'
                            }`}>
                              <span className="text-white font-semibold text-sm">
                                {tx.client.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{tx.client}</div>
                              <div className="text-sm text-gray-500">{tx.id} • {tx.method}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{tx.amount}</div>
                            <div className={`text-xs font-medium ${
                              tx.status === 'completed' ? 'text-green-600' :
                              tx.status === 'processing' ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {tx.status === 'completed' ? 'Completado' :
                               tx.status === 'processing' ? 'Procesando' : 'Pendiente'}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-lg font-bold text-gray-900">{mainFeatures[2].demo.stats.monthly}</div>
                        <div className="text-sm text-gray-600">Crecimiento mensual</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-lg font-bold text-gray-900">{mainFeatures[2].demo.stats.conversion}</div>
                        <div className="text-sm text-gray-600">Tasa de éxito</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-lg font-bold text-gray-900">850+</div>
                        <div className="text-sm text-gray-600">Transacciones/día</div>
                      </div>
                    </div>
                  </div>
                ) : activeTab === 3 ? (
                  // Analytics Demo
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h4>
                          <p className="text-sm text-gray-500">Métricas del último mes</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {mainFeatures[3].demo.metrics.map((metric, index) => (
                        <motion.div
                          key={metric.name}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.4 }}
                          className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-700">{metric.name}</h5>
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              metric.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {metric.change > 0 ? '+' : ''}{metric.change}%
                            </div>
                          </div>
                          <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {metric.name === 'Ingresos' ? `$${(metric.value/1000).toFixed(0)}K` : 
                               metric.name === 'Tasa conversión' ? `${metric.value}%` :
                               metric.name === 'Tiempo promedio' ? `${metric.value}min` : metric.value.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-500">/{metric.period}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2 text-purple-700 font-medium mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Insight destacado
                      </div>
                      <p className="text-sm text-purple-600">
                        Los martes tienen la mayor tasa de conversión (97.2%). Considera ofrecer promociones especiales este día.
                      </p>
                    </div>
                  </div>
                ) : activeTab === 4 ? (
                  // Mobile Apps Demo
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Apps Móviles</h4>
                          <p className="text-sm text-gray-500">iOS & Android nativas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">{mainFeatures[4].demo.downloads}</div>
                          <div className="text-sm text-gray-500">Descargas</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-yellow-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            {mainFeatures[4].demo.rating}
                          </div>
                          <div className="text-sm text-gray-500">Rating</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {mainFeatures[4].demo.features.map((feature, index) => (
                        <motion.div
                          key={feature.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.4 }}
                          className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 text-center"
                        >
                          <div className="text-3xl mb-2">{feature.icon}</div>
                          <h5 className="font-semibold text-gray-900 mb-1">{feature.name}</h5>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
                      <div className="flex items-center gap-2 text-pink-700 font-medium mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2m-6 0h8m-8 0a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2" />
                        </svg>
                        Próximamente
                      </div>
                      <p className="text-sm text-pink-600">
                        Las apps móviles estarán disponibles en Q2 2025. Regístrate para ser el primero en probarlas.
                      </p>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          variants={itemVariants}
          className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 shadow-2xl"
        >
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Listo para automatizar tu negocio?
            </h3>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Únete a más de 2,500 empresas que ya optimizan sus operaciones con BookFlow. 
              Comienza gratis y ve resultados inmediatos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Comenzar gratis
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Ver demo en vivo
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* SEO structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "BookFlow",
            "applicationCategory": "BusinessApplication",
            "featureList": [
              "Sistema de Reservas Inteligente",
              "Automatización Completa",
              "Dashboard Analytics",
              "Calendario Inteligente",
              "Notificaciones WhatsApp",
              "Reportes Avanzados"
            ],
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "CLP",
              "category": "Freemium"
            }
          })
        }}
      />
    </section>
  );
};

export default FeaturesSection;