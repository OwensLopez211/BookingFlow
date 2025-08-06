import React, { useEffect } from 'react';
import { NotificationContainer } from './NotificationContainer';
import { useNotificationStore } from '@/stores/notificationStore';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { cleanupExpired, processQueue } = useNotificationStore();
  
  // Conectar automáticamente a notificaciones en tiempo real
  useRealTimeNotifications();

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    const cleanup = setInterval(() => {
      cleanupExpired();
      processQueue();
    }, 5000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        cleanupExpired();
        processQueue();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleBeforeUnload = () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(cleanup);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [cleanupExpired, processQueue]);

  return (
    <>
      {children}
      <NotificationContainer />
    </>
  );
};