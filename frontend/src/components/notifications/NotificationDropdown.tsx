import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  EyeIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  UserIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { useBackendNotifications } from '@/hooks/useBackendNotifications';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { useAuthStore } from '@/stores/authStore';

interface NotificationDropdownProps {
  className?: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuthStore();
  const { isConnected } = useRealTimeNotifications();
  const isOwner = user?.role === 'owner';

  // Función para obtener icono y estilo basado en la categoría y tipo
  const getNotificationIconAndStyle = (notification: any) => {
    const { type, data } = notification;
    const category = data.category || 'appointment';
    const priority = data.priority || 'medium';

    let IconComponent;
    let bgColor;
    let iconColor;

    switch (category) {
      case 'appointment':
        IconComponent = CalendarDaysIcon;
        if (type === 'appointment_created') {
          bgColor = 'bg-emerald-500';
          iconColor = 'text-white';
        } else if (type === 'appointment_updated') {
          bgColor = 'bg-blue-500';
          iconColor = 'text-white';
        } else if (type === 'appointment_cancelled') {
          bgColor = 'bg-amber-500';
          iconColor = 'text-white';
        } else {
          bgColor = 'bg-blue-500';
          iconColor = 'text-white';
        }
        break;
      case 'system':
        IconComponent = ComputerDesktopIcon;
        bgColor = priority === 'critical' ? 'bg-red-500' : 'bg-purple-500';
        iconColor = 'text-white';
        break;
      case 'user':
        IconComponent = UserIcon;
        bgColor = 'bg-indigo-500';
        iconColor = 'text-white';
        break;
      case 'billing':
        IconComponent = CreditCardIcon;
        bgColor = 'bg-orange-500';
        iconColor = 'text-white';
        break;
      case 'security':
        IconComponent = ShieldCheckIcon;
        bgColor = 'bg-red-500';
        iconColor = 'text-white';
        break;
      default:
        IconComponent = InformationCircleIcon;
        bgColor = 'bg-gray-500';
        iconColor = 'text-white';
    }

    return { IconComponent, bgColor, iconColor };
  };
  
  // ✅ Usar notificaciones directamente del backend
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch
  } = useBackendNotifications();

  // Debug logging
  useEffect(() => {
    console.log('🔔 [NotificationDropdown] Component rendered/re-rendered');
    console.log('🔔 [NotificationDropdown] Current state:', {
      notificationsCount: notifications.length,
      unreadCount,
      isLoading,
      error,
      isOwner,
      isConnected
    });
    console.log('🔔 [NotificationDropdown] Notifications data:', notifications.map(n => ({ 
      id: n.id, 
      title: n.data.title, 
      isRead: n.isRead, 
      createdAt: n.createdAt 
    })));
  }, [notifications, unreadCount, isLoading, error, isOwner, isConnected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown when pressing Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const filteredNotifications = notifications
    .filter(notification => activeTab === 'all' || !notification.isRead)
    .slice(0, 10) // Mostrar máximo 10 notificaciones
    .sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = a.data.priority || 'medium';
      const bPriority = b.data.priority || 'medium';
      const priorityDiff = priorityOrder[bPriority] - priorityOrder[aPriority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleNotificationClick = (notification: any) => {
    console.log('🖱️ [NotificationDropdown] Notification clicked:', { id: notification.id, isRead: notification.isRead });
    if (!notification.isRead) {
      console.log('🖱️ [NotificationDropdown] Calling markAsRead for notification:', notification.id);
      markAsRead(notification.id);
    } else {
      console.log('🖱️ [NotificationDropdown] Notification already read, no action needed');
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={toggleDropdown}
        className={`
          relative p-2.5 rounded-xl transition-all duration-200 group
          ${isOpen 
            ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-200' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/80'
          }
        `}
        title={`${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`}
      >
        <BellIcon className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'scale-110' : 'group-hover:scale-105'}`} />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center ring-2 ring-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}

        {/* Active indicator */}
        {isOpen && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className={`
                absolute right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200/60 z-50 overflow-hidden
                w-80 max-w-[calc(100vw-2rem)] max-h-[80vh]
                md:w-96 md:max-h-96
                sm:w-72
              `}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellIcon className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">
                      Notificaciones
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {/* Real-time connection indicator */}
                    <div className={`w-2 h-2 rounded-full ${
                      isOwner 
                        ? (isConnected ? 'bg-green-500' : 'bg-gray-400')
                        : 'bg-amber-500'
                    }`} 
                         title={
                           isOwner 
                             ? (isConnected ? 'Conectado en tiempo real' : 'Desconectado')
                             : 'Solo owners reciben notificaciones en tiempo real'
                         } />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* Mark all as read */}
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Marcar todas como leídas"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Settings */}
                    <button
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Configuración"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                    </button>
                    
                    {/* Close */}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex mt-3 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`
                      flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                      ${activeTab === 'all'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    Todas ({notifications.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('unread')}
                    className={`
                      flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                      ${activeTab === 'unread'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    Sin leer ({unreadCount})
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {!isOwner && (
                  <div className="p-4 bg-amber-50 border-b border-amber-100">
                    <div className="flex items-center gap-2 text-amber-700">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <p className="text-xs font-medium">
                        Solo los propietarios reciben notificaciones en tiempo real
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Loading state */}
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Cargando...</span>
                  </div>
                )}
                
                {/* Error state */}
                {error && (
                  <div className="p-4 bg-red-50 border-b border-red-100">
                    <div className="flex items-center gap-2 text-red-700">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-xs font-medium">
                        Error cargando notificaciones: {error}
                      </p>
                      <button
                        onClick={refetch}
                        className="ml-auto text-xs underline hover:no-underline"
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>
                )}
                
                {filteredNotifications.length === 0 && !isLoading && !error ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <BellIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      No hay notificaciones
                    </h4>
                    <p className="text-xs text-gray-500 text-center">
                      {!isOwner 
                        ? 'Las notificaciones en tiempo real están disponibles solo para propietarios'
                        : activeTab === 'unread' 
                        ? 'No tienes notificaciones sin leer' 
                        : 'No hay notificaciones para mostrar'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredNotifications.map((notification, index) => {
                      const { IconComponent, bgColor, iconColor } = getNotificationIconAndStyle(notification);
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`
                            relative p-4 transition-all duration-200 cursor-pointer group border-l-4
                            ${!notification.isRead 
                              ? 'bg-gradient-to-r from-blue-50/80 to-blue-25/40 border-l-blue-500 shadow-sm hover:from-blue-100/80 hover:to-blue-50/60' 
                              : 'bg-white border-l-transparent hover:bg-gray-50/60'
                            }
                            ${!notification.isRead ? 'ring-1 ring-blue-100/50' : ''}
                          `}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-4 relative">
                            {/* Type Icon */}
                            <div className={`
                              flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105
                              ${bgColor}
                              ${!notification.isRead ? 'ring-2 ring-white shadow-md' : 'shadow-sm'}
                            `}>
                              <IconComponent className={`h-5 w-5 ${iconColor}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {/* Title with priority indicator */}
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`
                                      text-sm leading-tight transition-colors duration-200
                                      ${!notification.isRead 
                                        ? 'font-semibold text-gray-900' 
                                        : 'font-medium text-gray-700'
                                      }
                                    `}>
                                      {notification.data.title}
                                    </h4>
                                    
                                    {/* Priority indicator */}
                                    {notification.data.priority === 'high' && (
                                      <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0" title="Prioridad alta" />
                                    )}
                                    {notification.data.priority === 'critical' && (
                                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 animate-pulse" title="Prioridad crítica" />
                                    )}
                                    
                                    {/* Unread indicator */}
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" title="No leída" />
                                    )}
                                  </div>
                                  
                                  {/* Message */}
                                  {notification.data.message && (
                                    <p className={`
                                      text-xs mt-1 line-clamp-2 leading-relaxed
                                      ${!notification.isRead ? 'text-gray-600' : 'text-gray-500'}
                                    `}>
                                      {notification.data.message}
                                    </p>
                                  )}
                                  
                                  {/* Appointment details */}
                                  {notification.data.clientName && notification.data.serviceName && (
                                    <div className="flex items-center gap-2 mt-2 text-xs">
                                      <span className={`
                                        px-2 py-1 rounded-md text-xs font-medium
                                        ${!notification.isRead 
                                          ? 'bg-blue-100 text-blue-700' 
                                          : 'bg-gray-100 text-gray-600'
                                        }
                                      `}>
                                        {notification.data.clientName}
                                      </span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-gray-500">{notification.data.serviceName}</span>
                                    </div>
                                  )}
                                  
                                  {/* Timestamp */}
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-gray-400">
                                      {new Date(notification.createdAt).toLocaleString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit'
                                      })}
                                    </p>
                                    
                                    {/* Read status indicator */}
                                    <div className="flex items-center gap-1">
                                      {notification.isRead ? (
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                          <CheckIcon className="h-3 w-3" />
                                          Leída
                                        </span>
                                      ) : (
                                        <span className="text-xs text-blue-600 font-medium">
                                          Nueva
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                  {!notification.isRead && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Marcar como leída"
                                    >
                                      <EyeIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                        </div>

                          {/* Action buttons for appointments */}
                          {notification.data.appointmentId && (
                            <div className="mt-3 pl-14 flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Ver cita:', notification.data.appointmentId);
                                }}
                                className={`
                                  px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5
                                  ${!notification.isRead 
                                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }
                                `}
                              >
                                <CalendarDaysIcon className="h-3 w-3" />
                                Ver Cita
                              </button>
                              
                              {/* Quick action based on notification type */}
                              {notification.type === 'appointment_created' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Confirmar cita:', notification.data.appointmentId);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                >
                                  <CheckIcon className="h-3 w-3" />
                                  Confirmar
                                </button>
                              )}
                              
                              {notification.type === 'appointment_cancelled' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Gestionar cancelación:', notification.data.appointmentId);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200"
                                >
                                  <ExclamationTriangleIcon className="h-3 w-3" />
                                  Gestionar
                                </button>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {filteredNotifications.length > 0 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      // Aquí podrías abrir un modal o página completa de notificaciones
                    }}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-1 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};