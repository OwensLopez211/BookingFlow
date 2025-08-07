import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDropdownHover = (menuName: string, isEntering: boolean) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }

    if (isEntering) {
      setActiveDropdown(menuName);
    } else {
      dropdownTimeoutRef.current = setTimeout(() => {
        setActiveDropdown(null);
      }, 150);
    }
  };

  const dropdownMenus = {
    features: [
      { name: 'Sistema de Reservas', description: 'Gestiona reservas en tiempo real', href: '/features/reservations' },
      { name: 'Calendario Inteligente', description: 'Optimiza tu agenda automáticamente', href: '/features/calendar' },
      { name: 'Notificaciones', description: 'Recordatorios y alertas personalizadas', href: '/features/notifications' },
      { name: 'Reportes Avanzados', description: 'Analytics detallados de tu negocio', href: '/features/reports' },
      { name: 'Integraciones', description: 'Conecta con tus herramientas favoritas', href: '/features/integrations' }
    ],
    pricing: [
      { name: 'Plan Básico', description: 'Perfecto para empezar', href: '/pricing/basic' },
      { name: 'Plan Profesional', description: 'Para negocios en crecimiento', href: '/pricing/professional' },
      { name: 'Plan Empresa', description: 'Soluciones escalables', href: '/pricing/enterprise' },
      { name: 'Comparar Planes', description: 'Ve todas las características', href: '/pricing/compare' }
    ],
    roadmap: [
      { name: 'Próximas Funciones', description: 'Lo que viene en 2025', href: '/roadmap/upcoming' },
      { name: 'IA Predictiva', description: 'Predicción de demanda', href: '/roadmap/ai' },
      { name: 'App Móvil', description: 'Gestiona desde tu móvil', href: '/roadmap/mobile' },
      { name: 'API Pública', description: 'Integra BookFlow en tu sistema', href: '/roadmap/api' }
    ],
    about: [
      { name: 'Nuestra Historia', description: 'Cómo comenzó BookFlow', href: '/about/story' },
      { name: 'Equipo', description: 'Conoce a nuestro equipo', href: '/about/team' },
      { name: 'Casos de Éxito', description: 'Historias de nuestros clientes', href: '/about/success-stories' },
      { name: 'Contacto', description: 'Ponte en contacto con nosotros', href: '/about/contact' }
    ]
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/85 backdrop-blur-xl shadow-xl border-b border-purple-100/50' 
        : 'bg-white shadow-sm border-b border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group relative overflow-hidden rounded-lg px-2 py-1 transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50"
          >
            <div className="relative">
              <img 
                src="/miniatura.webp" 
                alt="BookFlow Logo"
                className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-300"></div>
            </div>
            <span className="text-[1.50rem] font-[700] leading-none text-gray-900 font-[Plus Jakarta Sans,sans-serif] transition-all duration-300 group-hover:text-purple-700">
              <span className="block transform transition-transform duration-300 group-hover:translate-x-0.5">Booking</span>
              <span className="block transform transition-transform duration-300 group-hover:translate-x-0.5">Flow</span>
            </span>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavDropdown 
              title="Características" 
              items={dropdownMenus.features}
              isActive={activeDropdown === 'features'}
              onHover={(isEntering) => handleDropdownHover('features', isEntering)}
            />
            <NavDropdown 
              title="Precios" 
              items={dropdownMenus.pricing}
              isActive={activeDropdown === 'pricing'}
              onHover={(isEntering) => handleDropdownHover('pricing', isEntering)}
            />
            <NavDropdown 
              title="Roadmap" 
              items={dropdownMenus.roadmap}
              isActive={activeDropdown === 'roadmap'}
              onHover={(isEntering) => handleDropdownHover('roadmap', isEntering)}
            />
            <NavDropdown 
              title="Acerca de" 
              items={dropdownMenus.about}
              isActive={activeDropdown === 'about'}
              onHover={(isEntering) => handleDropdownHover('about', isEntering)}
            />
            {/* <NavLink to="/welcome">🎉 Welcome</NavLink> */}
          </nav>

          {/* Botones Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/auth/login">
              <Button 
                variant="ghost" 
                className="relative overflow-hidden bg-white border border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-200 hover:text-purple-700 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="relative z-10">Iniciar Sesión</span>
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button 
                variant="primary" 
                className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="relative z-10">Registrarse</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 hover:opacity-30 transition-opacity duration-300"></div>
              </Button>
            </Link>
          </div>

          {/* Botón hamburguesa móvil */}
          <button
            className="md:hidden relative inline-flex items-center justify-center p-2 rounded-xl text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-all duration-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="sr-only">Abrir menú principal</span>
            <div className="relative w-6 h-6">
              <span className={`absolute block h-0.5 w-6 bg-current transform transition-all duration-300 ${
                isMobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'
              }`}></span>
              <span className={`absolute block h-0.5 w-6 bg-current transform transition-all duration-300 ${
                isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}></span>
              <span className={`absolute block h-0.5 w-6 bg-current transform transition-all duration-300 ${
                isMobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'
              }`}></span>
            </div>
          </button>
        </div>

        {/* Menú móvil mejorado */}
        <div className={`md:hidden overflow-hidden transition-all duration-500 ease-out ${
          isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className={`border-t transition-all duration-300 ${
            isScrolled 
              ? 'border-purple-100/50 bg-gradient-to-b from-white/95 to-purple-50/30 backdrop-blur-xl' 
              : 'border-gray-200 bg-white'
          }`}>
            <div className="px-4 pt-6 pb-4 space-y-3">
              <MobileAccordion 
                title="Características" 
                items={dropdownMenus.features}
                onItemClick={() => setIsMobileMenuOpen(false)}
              />
              <MobileAccordion 
                title="Precios" 
                items={dropdownMenus.pricing}
                onItemClick={() => setIsMobileMenuOpen(false)}
              />
              <MobileAccordion 
                title="Roadmap" 
                items={dropdownMenus.roadmap}
                onItemClick={() => setIsMobileMenuOpen(false)}
              />
              <MobileAccordion 
                title="Acerca de" 
                items={dropdownMenus.about}
                onItemClick={() => setIsMobileMenuOpen(false)}
              />
            </div>
            
            {/* Botones móviles */}
            <div className="pt-6 pb-6 border-t border-gray-200/50">
              <div className="flex flex-col px-4 space-y-3">
                <Link to="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center bg-white border border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-200 hover:text-purple-700 transition-all duration-300 py-3"
                  >
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button 
                    variant="primary" 
                    className="w-full justify-center bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 py-3"
                  >
                    Registrarse
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Componente NavDropdown para menús desplegables en desktop
const NavDropdown: React.FC<{
  title: string;
  items: Array<{ name: string; description: string; href: string }>;
  isActive: boolean;
  onHover: (isEntering: boolean) => void;
}> = ({ title, items, isActive, onHover }) => {
  return (
    <div 
      className="relative"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <button className="px-4 py-2 rounded-xl text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 font-medium text-sm flex items-center space-x-1 group">
        <span>{title}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'rotate-180' : ''} group-hover:text-purple-500`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown Menu */}
      <div className={`absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 transition-all duration-300 transform ${
        isActive ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'
      }`}>
        <div className="p-2">
          {items.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className="block p-3 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 group"
            >
              <div className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors duration-200">
                {item.name}
              </div>
              <div className="text-sm text-gray-500 group-hover:text-purple-600 transition-colors duration-200">
                {item.description}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente MobileAccordion para menús móviles
const MobileAccordion: React.FC<{
  title: string;
  items: Array<{ name: string; description: string; href: string }>;
  onItemClick: () => void;
}> = ({ title, items, onItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 group"
      >
        <span className="font-medium text-gray-700 group-hover:text-purple-700">{title}</span>
        <svg 
          className={`w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-out ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="border-t border-gray-200/50 bg-gradient-to-b from-white to-gray-50/50">
          {items.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              onClick={onItemClick}
              className="block px-6 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 group border-b border-gray-100/50 last:border-b-0"
            >
              <div className="font-medium text-gray-800 group-hover:text-purple-700 text-sm transition-colors duration-200">
                {item.name}
              </div>
              <div className="text-xs text-gray-500 group-hover:text-purple-600 mt-0.5 transition-colors duration-200">
                {item.description}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};