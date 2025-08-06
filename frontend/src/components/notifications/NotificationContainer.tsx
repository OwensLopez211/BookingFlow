import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationItem } from './NotificationItem';

interface NotificationContainerProps {
  className?: string;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({ 
  className = '' 
}) => {
  const { notifications, settings, processQueue, cleanupExpired } = useNotificationStore();

  useEffect(() => {
    processQueue();
    
    const interval = setInterval(() => {
      cleanupExpired();
      processQueue();
    }, 1000);

    return () => clearInterval(interval);
  }, [processQueue, cleanupExpired]);

  const visibleNotifications = notifications
    .filter(notification => 
      !notification.dismissed && 
      !notification.persistent // ✅ Solo mostrar toasts temporales (no persistentes)
    )
    .slice(0, settings.maxVisible)
    .sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // 🔍 DEBUG: Log para verificar estado (comentado para evitar spam)
  // console.log('🔔 NotificationContainer Debug:', {
  //   totalNotifications: notifications.length,
  //   visibleNotifications: visibleNotifications.length,
  //   settings: settings,
  //   settingsEnabled: settings.enabled,
  //   notifications: notifications.map(n => ({
  //     id: n.id,
  //     title: n.title,
  //     dismissed: n.dismissed,
  //     persistent: n.persistent,
  //     type: n.type,
  //     category: n.category,
  //     createdAt: n.createdAt,
  //     expiresAt: n.expiresAt
  //   }))
  // });

  const getPositionClasses = () => {
    switch (settings.position) {
      case 'top-right':
        return 'top-4 right-4 items-end';
      case 'top-left':
        return 'top-4 left-4 items-start';
      case 'bottom-right':
        return 'bottom-4 right-4 items-end';
      case 'bottom-left':
        return 'bottom-4 left-4 items-start';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2 items-center';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2 items-center';
      default:
        return 'bottom-4 right-4 items-end';
    }
  };

  const getAnimationDirection = () => {
    const position = settings.position;
    if (position.includes('right')) return { x: 100, opacity: 0 };
    if (position.includes('left')) return { x: -100, opacity: 0 };
    if (position.includes('top')) return { y: -100, opacity: 0 };
    return { y: 100, opacity: 0 };
  };

  if (!settings.enabled || visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div 
      className={`
        fixed z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none
        ${getPositionClasses()}
        ${className}
      `}
    >
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            layout
            initial={getAnimationDirection()}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={getAnimationDirection()}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 500,
              mass: 0.8,
            }}
            className="pointer-events-auto"
          >
            <NotificationItem 
              notification={notification}
              onDismiss={() => useNotificationStore.getState().dismissNotification(notification.id)}
              onMarkRead={() => useNotificationStore.getState().markAsRead(notification.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};