import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface BackendNotification {
  id: string;
  type: 'appointment_created' | 'appointment_updated' | 'appointment_cancelled' | 'system_notification';
  data: {
    title: string;
    message?: string;
    category?: 'appointment' | 'system' | 'user' | 'billing' | 'security';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    appointmentId?: string;
    clientName?: string;
    serviceName?: string;
    date?: string;
    time?: string;
  };
  orgId: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseBackendNotificationsReturn {
  notifications: BackendNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useBackendNotifications = (): UseBackendNotificationsReturn => {
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuthStore();
  const isOwner = user?.role === 'owner';

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !isOwner) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${API_BASE_URL}/v1/notifications?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.notifications)) {
        // Ordenar por fecha (más recientes primero)
        const sortedNotifications = data.notifications.sort((a: BackendNotification, b: BackendNotification) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotifications(sortedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isOwner]);

  const markAsRead = useCallback(async (notificationId: string) => {
    console.log('🔖 [useBackendNotifications] Marking notification as read:', notificationId);
    console.log('🔖 [useBackendNotifications] Current notifications before update:', notifications.map(n => ({ id: n.id, isRead: n.isRead })));
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      if (!token) {
        console.error('❌ [useBackendNotifications] No auth token available');
        throw new Error('No auth token available');
      }

      console.log('📡 [useBackendNotifications] Sending PUT request to:', `${API_BASE_URL}/v1/notifications/${notificationId}/read`);
      console.log('📡 [useBackendNotifications] With headers:', { 'Authorization': `Bearer ${token.substring(0, 20)}...` });
      
      const response = await fetch(`${API_BASE_URL}/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📨 [useBackendNotifications] Response status:', response.status);
      console.log('📨 [useBackendNotifications] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ [useBackendNotifications] Successfully marked as read, response:', responseData);
        console.log('✅ [useBackendNotifications] Updating local state for notification:', notificationId);
        
        // Actualizar el estado local
        setNotifications(prev => {
          const updated = prev.map(n => 
            n.id === notificationId 
              ? { ...n, isRead: true }
              : n
          );
          console.log('✅ [useBackendNotifications] Updated notifications:', updated.map(n => ({ id: n.id, isRead: n.isRead })));
          return updated;
        });
        
        console.log('✅ [useBackendNotifications] Local state update completed');
      } else {
        const errorText = await response.text();
        console.error('❌ [useBackendNotifications] Failed to mark as read:', response.statusText, 'Error:', errorText);
      }
    } catch (err) {
      console.error('❌ [useBackendNotifications] Error marking notification as read:', err);
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${API_BASE_URL}/v1/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Actualizar el estado local
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Fetch inicial y cuando cambie la autenticación
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ✅ Escuchar eventos de notificaciones en tiempo real para refrescar
  useEffect(() => {
    const handleRealTimeNotification = (event: CustomEvent) => {
      console.log('🔄 [useBackendNotifications] Real-time notification received:', event.detail);
      console.log('🔄 [useBackendNotifications] Current notifications count:', notifications.length);
      console.log('🔄 [useBackendNotifications] Refreshing backend notifications...');
      fetchNotifications();
    };

    // Escuchar el eventBus para notificaciones en tiempo real
    if (typeof window !== 'undefined') {
      console.log('🎧 [useBackendNotifications] Setting up event listener for realtime-notification-received');
      console.log('🎧 [useBackendNotifications] Current listener count on window:', Object.keys(window).filter(k => k.includes('event')).length);
      
      window.addEventListener('realtime-notification-received', handleRealTimeNotification as EventListener);
      
      // Test that the event listener is working
      console.log('🧪 [useBackendNotifications] Testing event listener setup...');
      setTimeout(() => {
        console.log('🧪 [useBackendNotifications] Dispatching test event');
        window.dispatchEvent(new CustomEvent('realtime-notification-received', { 
          detail: { test: true, timestamp: new Date().toISOString() } 
        }));
      }, 1000);
      
      return () => {
        console.log('🧹 [useBackendNotifications] Cleaning up event listener');
        window.removeEventListener('realtime-notification-received', handleRealTimeNotification as EventListener);
      };
    }
  }, [fetchNotifications]);

  // Auto-refresh cada 30 segundos si hay notificaciones no leídas
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    if (unreadCount > 0 && isAuthenticated && isOwner) {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [notifications, isAuthenticated, isOwner, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};