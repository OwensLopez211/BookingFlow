import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CalendarIcon, 
  BookOpenIcon, 
  ChartBarIcon,
  ChevronDownIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { TrialStatusBadge } from '@/components/ui';
import { NotificationDropdown } from '@/components/notifications';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, enabled: true },
  { name: 'Calendario', href: '/appointments', icon: CalendarIcon, enabled: true },
  { name: 'Recursos', href: '/resources', icon: BookOpenIcon, enabled: false },
  { name: 'Análisis', href: '/analytics', icon: ChartBarIcon, enabled: false },
];

export const NavigationBar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const user = useAuthStore(state => state.user);
  const organization = useAuthStore(state => state.organization);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/auth/login');
  };

  const displayName = user?.profile?.firstName
    ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
    : user?.email || 'Usuario';

  const displayOrganization = organization?.name || 'Mi Organización';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActiveRoute = (href: string) => location.pathname === href;

  return (
    <>
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Desktop */}
            <div className="hidden md:flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3 group">
                <img 
                  src="/miniatura.webp" 
                  alt="BookFlow" 
                  className="w-9 h-9 object-contain group-hover:scale-105 transition-transform duration-200"
                />
                <span className="text-xl font-semibold text-gray-900 tracking-tight">BookFlow</span>
              </Link>
            </div>

            {/* Mobile Header - Logo a la izquierda */}
            <div className="md:hidden flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2 group">
                <img 
                  src="/miniatura.webp" 
                  alt="BookFlow" 
                  className="w-8 h-8 object-contain group-hover:scale-105 transition-transform duration-200"
                />
                <span className="text-lg font-semibold text-gray-900 tracking-tight">BookFlow</span>
              </Link>
            </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = isActiveRoute(item.href);
              const isDisabled = !item.enabled;
              
              if (isDisabled) {
                return (
                  <div
                    key={item.name}
                    className="relative flex flex-col items-center space-y-1 px-3 py-2 font-medium text-gray-400 cursor-not-allowed opacity-50"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{item.name}</span>
                    <span className="absolute -top-1 -right-1 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium">
                      Próximamente
                    </span>
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    relative flex flex-col items-center space-y-1 px-3 py-2 font-medium transition-all duration-200 group
                    ${isActive 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className={`h-5 w-5 transition-colors duration-200`} />
                  <span className="text-xs font-medium">{item.name}</span>
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-blue-600 transition-all duration-200 ${
                    isActive 
                      ? 'w-8 opacity-100' 
                      : 'w-0 opacity-0 group-hover:w-8 group-hover:opacity-100'
                  }`} />
                </Link>
              );
            })}
          </nav>

          {/* Right side - Public Site, Notifications & User Menu */}
          <div className="flex items-center space-x-2">
            {/* Public Site Button */}
            <Link
              to={`/book/${organization?.id || 'demo'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
              title="Ver sitio público de reservas"
            >
              <GlobeAltIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white animate-pulse"></div>
            </Link>

            {/* Trial Status Badge */}
            <div className="hidden sm:block">
              <TrialStatusBadge />
            </div>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-200"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                  <span className="text-gray-700 font-semibold text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{displayName}</p>
                  <p className="text-xs text-gray-500 leading-tight">{displayOrganization}</p>
                </div>
                <ChevronDownIcon className={`hidden md:block h-4 w-4 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200/60 z-20 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">{displayOrganization}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <span>Mi Perfil</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <span>Configuración</span>
                    </Link>
                    {(user?.role === 'owner' || user?.role === 'admin') && (
                      <Link
                        to="/metrics"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <span>Métricas y Costos</span>
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-gray-100 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/50">
        <div className="flex items-center justify-around py-2 px-4">
          {navigation.map((item) => {
            const isActive = isActiveRoute(item.href);
            const isDisabled = !item.enabled;
            
            if (isDisabled) {
              return (
                <div
                  key={item.name}
                  className="relative flex flex-col items-center space-y-1 px-3 py-2 rounded-xl text-gray-400 cursor-not-allowed opacity-50"
                >
                  <div className="p-1.5 rounded-lg">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{item.name}</span>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
                </div>
              );
            }
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  relative flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50' 
                    : 'hover:bg-gray-100'
                }`}>
                  <item.icon className={`h-5 w-5`} />
                </div>
                <span className="text-xs font-medium">{item.name}</span>
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};