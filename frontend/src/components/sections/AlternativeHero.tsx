import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import LightRays from '@/components/ui/LightRays';
import Agenda3D from '@/components/ui/Agenda3D';

export const AlternativeHero: React.FC = () => {
  return (
    <div className="w-full h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] xl:h-[90vh] relative overflow-hidden bg-black">
      {/* Background LightRays */}
      <div className="absolute inset-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#4508a1"
          raysSpeed={0.3}
          lightSpread={0.5}
          rayLength={1.5}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.0}
          distortion={10}
        />
      </div>

      {/* Content Layout */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
            {/* Left Side - Content */}
            <div className="flex flex-col justify-center space-y-4 lg:space-y-6 text-left lg:text-left text-center">
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-purple-500/20">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 lg:mb-6 leading-tight">
                  Simplifica tu
                  <span className="block bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                    Gestión de Citas
                  </span>
                </h1>
                
                <p className="text-base sm:text-lg lg:text-xl text-purple-100 mb-6 lg:mb-8 max-w-xl lg:max-w-none mx-auto lg:mx-0 leading-relaxed">
                  BookFlow revoluciona la manera en que manejas las reservas de tu negocio. 
                  Potente, intuitivo y diseñado para crecer contigo.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 px-6 lg:px-8 py-3 lg:py-4 text-base lg:text-lg font-semibold w-full"
                    >
                      Comienza Gratis
                    </Button>
                  </Link>
                  
                  <Link to="/features" className="w-full sm:w-auto">
                    <Button 
                      variant="ghost" 
                      size="lg"
                      className="text-white border-purple-300/30 hover:bg-purple-500/10 hover:border-purple-300/50 px-6 lg:px-8 py-3 lg:py-4 text-base lg:text-lg font-semibold transition-all duration-300 w-full"
                    >
                      Ver Características
                    </Button>
                  </Link>
                </div>
                
                <div className="mt-6 lg:mt-8 text-purple-200">
                  <p className="text-xs sm:text-sm opacity-80">
                    ✨ Sin tarjeta de crédito • ⚡ Configuración en 5 minutos • 🔒 100% Seguro
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Agenda 3D */}
            <div className="flex justify-center items-center relative mt-8 lg:mt-0">
              <div className="transform hover:scale-105 transition-transform duration-500 hover:rotate-1 w-full max-w-sm lg:max-w-none">
                <Agenda3D />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gradient Overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/10 pointer-events-none"></div>
    </div>
  );
};