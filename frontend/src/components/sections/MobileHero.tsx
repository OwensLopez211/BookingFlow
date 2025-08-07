import React from 'react';

const MobileHero: React.FC = () => {
  return (
    <div className="relative w-full h-[80vh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex items-center justify-center">
      {/* Sophisticated background layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/20 via-transparent to-cyan-950/20"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-emerald-950/10 via-transparent to-teal-950/15"></div>
        
        {/* Minimal geometric pattern */}
        <div className="absolute inset-0 opacity-[0.02]" 
             style={{
               backgroundImage: `
                 radial-gradient(circle at 25% 25%, #14b8a6 1px, transparent 1px),
                 radial-gradient(circle at 75% 75%, #0d9488 1px, transparent 1px)
               `,
               backgroundSize: '100px 100px, 80px 80px'
             }}>
        </div>
      </div>

      {/* Subtle ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-teal-400/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-32 h-32 bg-cyan-400/3 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center space-y-16">
          
          {/* Clean typography section */}
          <div className="space-y-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-800/50 border border-teal-400/20 text-teal-300 text-sm font-medium backdrop-blur-sm">
              <div className="w-2 h-2 bg-teal-400 rounded-full mr-3 animate-pulse"></div>
              Plataforma de Gestión de Citas
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                Programa,
              </span>
              <br />
              <span className="bg-gradient-to-r from-gray-200 via-gray-100 to-white bg-clip-text text-transparent">
                Gestiona &
              </span>
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent font-extrabold">
                Flow
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 font-light leading-relaxed max-w-2xl mx-auto">
              Con BookingFlow gestiona tu agenda de manera inteligente y despreocúpate del resto.
            </p>
          </div>

          {/* Calendar/Booking visual centerpiece */}
          <div className="relative flex justify-center items-center">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem]">
              
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-400/15 via-cyan-400/15 to-emerald-400/15 blur-2xl animate-pulse"></div>
              
              {/* Main booking interface mockup */}
              <div className="absolute inset-4 rounded-2xl border border-teal-400/20 bg-gradient-to-br from-slate-800/60 via-slate-900/80 to-slate-800/60 backdrop-blur-sm overflow-hidden">
                
                {/* Calendar header */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-teal-950/40 to-cyan-950/40 border-b border-teal-400/10 flex items-center justify-center">
                  <div className="text-teal-300 text-sm font-medium">Agosto 2025</div>
                  <div className="absolute left-4 w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                  <div className="absolute right-4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
                
                {/* Calendar grid */}
                <div className="absolute top-16 left-4 right-4 bottom-4">
                  <div className="grid grid-cols-7 gap-1 h-full">
                    {/* Days of week */}
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                      <div key={day} className="flex items-center justify-center text-xs text-gray-400 font-medium h-8">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {Array.from({ length: 35 }).map((_, i) => {
                      const isActive = i === 12 || i === 15 || i === 20 || i === 25;
                      const hasBooking = i === 15 || i === 20;
                      
                      return (
                        <div 
                          key={i} 
                          className={`
                            relative flex items-center justify-center text-xs rounded-md transition-all duration-300
                            ${isActive 
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' 
                              : 'text-gray-500 hover:bg-slate-700/30'
                            }
                          `}
                        >
                          <span>{i > 6 && i < 32 ? i - 6 : ''}</span>
                          {hasBooking && (
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Floating booking cards */}
                <div className="absolute -right-2 top-20 w-24 h-16 bg-gradient-to-br from-teal-500/30 to-cyan-500/30 rounded-lg border border-teal-400/20 backdrop-blur-sm animate-float-slow opacity-80">
                  <div className="p-2 text-xs text-teal-200">
                    <div className="font-medium">10:00</div>
                    <div className="text-teal-300/70">Cita</div>
                  </div>
                </div>
                
                <div className="absolute -left-2 bottom-20 w-24 h-16 bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm animate-float-slow opacity-80" style={{ animationDelay: '1.5s' }}>
                  <div className="p-2 text-xs text-cyan-200">
                    <div className="font-medium">14:30</div>
                    <div className="text-cyan-300/70">Reserva</div>
                  </div>
                </div>
                
                {/* Status indicators */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  </div>
                  <div className="text-xs text-gray-400 font-medium">BookFlow</div>
                </div>
              </div>
              
              {/* Orbiting connection lines */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`orbit-${i}`}
                  className="absolute inset-0 animate-spin opacity-30"
                  style={{
                    animationDuration: `${25 + i * 5}s`,
                    animationDelay: `${i * 2}s`
                  }}
                >
                  <div
                    className="absolute w-1 h-1 bg-teal-400 rounded-full"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-${140 + i * 8}px)`,
                      boxShadow: '0 0 8px rgba(20, 184, 166, 0.5)'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Clean CTA section */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group relative overflow-hidden bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 hover:from-teal-500 hover:via-teal-400 hover:to-cyan-500 text-white font-semibold px-10 py-5 rounded-xl text-base lg:text-lg transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-teal-500/20 active:scale-[0.98] border border-teal-400/20">
                <span className="relative z-10 flex items-center gap-3">
                  ÚNETE AHORA
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <button className="group text-teal-300 hover:text-white font-medium px-8 py-5 rounded-xl border border-teal-400/20 hover:border-teal-400/40 bg-slate-800/40 hover:bg-slate-800/60 transition-all duration-300 text-base backdrop-blur-sm">
                <span className="flex items-center gap-3">
                  Ver Demo
                  <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </button>
            </div>
            
            {/* Trust indicators - clean and minimal */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Transbank OneClick</span>
              </div>
              <div className="w-px h-5 bg-gray-600"></div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 7v2m-6 8h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                <span>15 días gratuitos</span>
              </div>
              <div className="w-px h-5 bg-gray-600"></div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Seguro SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal corner accents */}
      <div className="absolute top-8 left-8 w-8 h-8 border-l border-t border-teal-400/20"></div>
      <div className="absolute top-8 right-8 w-8 h-8 border-r border-t border-teal-400/20"></div>
      <div className="absolute bottom-8 left-8 w-8 h-8 border-l border-b border-teal-400/20"></div>
      <div className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-teal-400/20"></div>
      
      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MobileHero;