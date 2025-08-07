import React, { useState, useEffect } from 'react';

interface CalendarEvent {
  id: number;
  time: string;
  title: string;
  type: 'confirmed' | 'pending' | 'blocked';
  client?: string;
  duration: number;
}

const sampleEvents: CalendarEvent[] = [
  { 
    id: 1, 
    time: '09:00', 
    title: 'Corte de Cabello', 
    type: 'confirmed', 
    client: 'Juan Pérez',
    duration: 60
  },
  { 
    id: 2, 
    time: '10:30', 
    title: 'Manicure', 
    type: 'confirmed', 
    client: 'María García',
    duration: 45
  },
  { 
    id: 3, 
    time: '12:00', 
    title: 'Consulta', 
    type: 'pending', 
    client: 'Ana López',
    duration: 30
  },
  { 
    id: 4, 
    time: '14:00', 
    title: 'Masaje', 
    type: 'confirmed', 
    client: 'Carlos Ruiz',
    duration: 90
  },
  { 
    id: 5, 
    time: '15:30', 
    title: 'Descanso', 
    type: 'blocked',
    duration: 30
  },
  { 
    id: 6, 
    time: '16:00', 
    title: 'Tratamiento Facial', 
    type: 'pending', 
    client: 'Laura Martín',
    duration: 75
  }
];

const Agenda3D: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-amber-500';
      case 'blocked':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatTime = (time: string) => {
    return time;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div 
      className="w-full max-w-md mx-auto"
      style={{
        transform: 'perspective(800px) rotateX(1deg)',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Minimal Header */}
      <div className="bg-white/5 backdrop-blur-md rounded-t-2xl p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white/90">
              Agenda
            </h3>
            <p className="text-white/50 text-sm">
              {currentTime.toLocaleDateString('es-ES', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
              })}
            </p>
          </div>
          <div className="text-white/60 text-sm font-mono">
            {currentTime.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>

      {/* Clean Event List */}
      <div className="bg-white/[0.02] backdrop-blur-md border-l border-r border-white/5">
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {sampleEvents.map((event, index) => (
            <div
              key={event.id}
              className="group relative border-b border-white/5 hover:bg-white/[0.02] transition-all duration-300"
              style={{
                transform: `translateZ(${index}px)`,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Event Row */}
              <div 
                className="flex items-center p-4 cursor-pointer"
                onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
              >
                {/* Status Indicator */}
                <div className={`w-2 h-2 rounded-full ${getStatusColor(event.type)} mr-4 flex-shrink-0`}></div>
                
                {/* Time */}
                <div className="w-16 text-white/70 text-sm font-mono text-center">
                  {formatTime(event.time)}
                </div>
                
                {/* Event Info */}
                <div className="flex-1 ml-4">
                  <h4 className="text-white/90 font-medium text-sm leading-tight">{event.title}</h4>
                  {event.client && (
                    <p className="text-white/50 text-xs mt-1">{event.client}</p>
                  )}
                </div>

                {/* Duration & Arrow */}
                <div className="flex items-center space-x-2 text-white/50">
                  <span className="text-xs">{formatDuration(event.duration)}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${selectedEvent === event.id ? 'rotate-90' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Expandable Details */}
              {selectedEvent === event.id && (
                <div className="px-4 pb-4 border-t border-white/5 bg-white/[0.01]">
                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">Estado:</span>
                      <span className={`
                        ${event.type === 'confirmed' ? 'text-green-400' : ''}
                        ${event.type === 'pending' ? 'text-amber-400' : ''}
                        ${event.type === 'blocked' ? 'text-gray-400' : ''}
                      `}>
                        {event.type === 'confirmed' ? 'Confirmado' : ''}
                        {event.type === 'pending' ? 'Pendiente' : ''}
                        {event.type === 'blocked' ? 'Bloqueado' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">Duración:</span>
                      <span className="text-white/70">{formatDuration(event.duration)}</span>
                    </div>
                    {event.client && (
                      <div className="flex justify-between text-xs">
                        <span className="text-white/50">Cliente:</span>
                        <span className="text-white/70">{event.client}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="bg-white/5 backdrop-blur-md rounded-b-2xl p-3 border border-white/10">
        <div className="text-center">
          <button className="text-white/60 hover:text-white/90 text-sm transition-colors duration-200">
            Ver más →
          </button>
        </div>
      </div>

      {/* Subtle Shadow */}
      <div className="absolute inset-0 bg-black/20 rounded-2xl transform translate-y-1 -z-10 blur-sm"></div>
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(139, 92, 246, 0.6), rgba(168, 85, 247, 0.8));
          border-radius: 3px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(139, 92, 246, 0.8), rgba(168, 85, 247, 1));
        }
        
        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.6) rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
};

export default Agenda3D;