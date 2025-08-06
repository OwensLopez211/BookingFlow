import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationItem } from './NotificationItem';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'unread' | 'system' | 'user' | 'appointment' | 'billing' | 'security';
type PriorityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    dismissNotification,
    getUnreadCount,
  } = useNotificationStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      if (filter === 'unread' && notification.isRead) return false;
      if (filter !== 'all' && filter !== 'unread' && notification.category !== filter) return false;
      if (priorityFilter !== 'all' && notification.priority !== priorityFilter) return false;
      return true;
    }).sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = getUnreadCount();

  const handleMarkAllAsRead = () => {
    const categoryFilter = filter === 'all' || filter === 'unread' ? undefined : filter;
    markAllAsRead(categoryFilter);
  };

  const handleClearAll = () => {
    const categoryFilter = filter === 'all' || filter === 'unread' ? undefined : filter;
    clearAll(categoryFilter);
  };

  const filterOptions: { value: FilterType; label: string; count?: number }[] = [
    { value: 'all', label: 'Todas', count: notifications.length },
    { value: 'unread', label: 'No leídas', count: unreadCount },
    { value: 'system', label: 'Sistema' },
    { value: 'user', label: 'Usuario' },
    { value: 'appointment', label: 'Citas' },
    { value: 'billing', label: 'Facturación' },
    { value: 'security', label: 'Seguridad' },
  ];

  const priorityOptions: { value: PriorityFilter; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'critical', label: 'Críticas' },
    { value: 'high', label: 'Altas' },
    { value: 'medium', label: 'Medias' },
    { value: 'low', label: 'Bajas' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Notification Center Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <BellIcon className="h-6 w-6" />
                <div>
                  <h2 className="font-semibold text-lg">Centro de Notificaciones</h2>
                  {unreadCount > 0 && (
                    <p className="text-blue-100 text-sm">
                      {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Controls */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-3">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1
                      ${filter === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    {option.label}
                    {option.count !== undefined && (
                      <span className={`
                        text-xs px-1.5 py-0.5 rounded-full
                        ${filter === option.value ? 'bg-blue-500' : 'bg-gray-200'}
                      `}>
                        {option.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-2 mb-3">
                <FunnelIcon className="h-4 w-4 text-gray-500" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      Prioridad: {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={filteredNotifications.filter(n => !n.isRead).length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckIcon className="h-4 w-4" />
                  Marcar leídas
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={filteredNotifications.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Limpiar
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay notificaciones
                  </h3>
                  <p className="text-gray-500">
                    {filter === 'unread' 
                      ? 'No tienes notificaciones sin leer'
                      : 'No hay notificaciones para mostrar con los filtros actuales'
                    }
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDismiss={() => dismissNotification(notification.id)}
                    onMarkRead={() => markAsRead(notification.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};