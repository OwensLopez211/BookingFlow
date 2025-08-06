import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { eventBus } from '@/services/eventBus';

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'critical';
  category: 'system' | 'user' | 'appointment' | 'billing' | 'security';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  dismissed?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  categories: {
    system: boolean;
    user: boolean;
    appointment: boolean;
    billing: boolean;
    security: boolean;
  };
  priority: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxVisible: number;
  sounds: boolean;
  desktop: boolean;
}

interface NotificationQueue {
  notifications: Notification[];
  processing: boolean;
}

interface NotificationState {
  notifications: Notification[];
  queue: NotificationQueue;
  settings: NotificationSettings;
  
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => string;
  addNotificationSilently: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (category?: string) => void;
  clearAll: (category?: string) => void;
  dismissNotification: (id: string) => void;
  processQueue: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  getUnreadCount: (category?: string) => number;
  getNotificationsByCategory: (category: string) => Notification[];
  getNotificationsByPriority: (priority: string) => Notification[];
  cleanupExpired: () => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  categories: {
    system: true,
    user: true,
    appointment: true,
    billing: true,
    security: true,
  },
  priority: {
    low: true,
    medium: true,
    high: true,
    critical: true,
  },
  position: 'bottom-right',
  maxVisible: 5,
  sounds: true,
  desktop: false,
};

const generateId = (): string => {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const DEFAULT_DURATIONS = {
  success: 4000,
  info: 3500,
  warning: 4500,
  error: 5000,
  critical: 0, // Persistent by default
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [], // ✅ Siempre inicia vacío - se llenan desde el backend
      queue: {
        notifications: [],
        processing: false,
      },
      settings: DEFAULT_SETTINGS,

      addNotification: (notificationData) => {
        const id = generateId();
        const now = new Date();
        
        const notification: Notification = {
          ...notificationData,
          id,
          isRead: false,
          createdAt: now,
          expiresAt: notificationData.duration 
            ? new Date(now.getTime() + notificationData.duration)
            : notificationData.type === 'critical' || notificationData.persistent
            ? undefined
            : new Date(now.getTime() + (DEFAULT_DURATIONS[notificationData.type] || 4000)),
        };


        const { settings } = get();
        
        if (!settings.enabled) {
          return id;
        }
        if (!settings.categories[notification.category]) {
          return id;
        }
        if (!settings.priority[notification.priority]) {
          return id;
        }

        set(state => ({
          queue: {
            ...state.queue,
            notifications: [...state.queue.notifications, notification],
          }
        }));

        get().processQueue();
        
        eventBus.emit('notification:show', notification);
        
        if (notification.expiresAt && !notification.persistent) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration || DEFAULT_DURATIONS[notification.type] || 4000);
        }

        return id;
      },

      addNotificationSilently: (notificationData) => {
        const id = generateId();
        const now = notificationData.metadata?.createdAt 
          ? new Date(notificationData.metadata.createdAt)
          : new Date();
        
        const notification: Notification = {
          ...notificationData,
          id,
          isRead: notificationData.metadata?.isRead || false,
          createdAt: now,
          expiresAt: notificationData.duration 
            ? new Date(now.getTime() + notificationData.duration)
            : notificationData.type === 'critical' || notificationData.persistent
            ? undefined
            : undefined, // No expira automáticamente para notificaciones del historial
        };

        // ✅ Agregar directamente al historial SIN mostrar toast ni procesar queue
        set(state => ({
          notifications: [...state.notifications, notification]
        }));

        return id;
      },

      removeNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
          queue: {
            ...state.queue,
            notifications: state.queue.notifications.filter(n => n.id !== id),
          }
        }));
        
        eventBus.emit('notification:dismiss', { id });
      },

      markAsRead: (id) => {
        const notification = get().notifications.find(n => n.id === id);
        
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === id 
              ? { ...notification, isRead: true }
              : notification
          )
        }));
        
        // Si la notificación viene del backend, sincronizar con el backend
        if (notification?.metadata?.backendId) {
          import('../services/realTimeNotificationService').then(({ realTimeNotificationService }) => {
            realTimeNotificationService.markAsReadInBackend(notification.metadata.backendId);
          });
        }
        
        eventBus.emit('notification:mark-read', { id });
      },

      markAllAsRead: (category) => {
        const notificationsToMarkAsRead = get().notifications.filter(notification =>
          !category || notification.category === category
        );
        
        set(state => ({
          notifications: state.notifications.map(notification =>
            !category || notification.category === category
              ? { ...notification, isRead: true }
              : notification
          )
        }));
        
        // Si hay notificaciones del backend, sincronizar con el backend
        const hasBackendNotifications = notificationsToMarkAsRead.some(n => n.metadata?.backendId);
        if (hasBackendNotifications) {
          import('../services/realTimeNotificationService').then(({ realTimeNotificationService }) => {
            realTimeNotificationService.markAllAsReadInBackend();
          });
        }
        
        eventBus.emit('notification:mark-all-read', { category });
      },

      clearAll: (category) => {
        set(state => ({
          notifications: category
            ? state.notifications.filter(n => n.category !== category)
            : [],
          queue: {
            ...state.queue,
            notifications: category
              ? state.queue.notifications.filter(n => n.category !== category)
              : [],
          }
        }));
        
        eventBus.emit('notification:clear-all', { category });
      },

      dismissNotification: (id) => {
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === id 
              ? { ...notification, dismissed: true }
              : notification
          )
        }));
        
        setTimeout(() => {
          get().removeNotification(id);
        }, 300);
      },

      processQueue: () => {
        const { queue, settings, notifications } = get();
        
        if (queue.processing || queue.notifications.length === 0) {
          return;
        }
        
        set(state => ({
          queue: { ...state.queue, processing: true }
        }));

        const visibleCount = notifications.filter(n => !n.dismissed).length;
        const canShow = settings.maxVisible - visibleCount;
        
        if (canShow > 0) {
          const toShow = queue.notifications
            .slice(0, canShow)
            .sort((a, b) => {
              const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            });

          set(state => ({
            notifications: [...state.notifications, ...toShow],
            queue: {
              notifications: state.queue.notifications.slice(toShow.length),
              processing: false,
            }
          }));
        } else {
          set(state => ({
            queue: { ...state.queue, processing: false }
          }));
        }
      },

      updateSettings: (newSettings) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },

      getUnreadCount: (category) => {
        const { notifications } = get();
        return notifications.filter(n => 
          !n.isRead && 
          (!category || n.category === category)
        ).length;
      },

      getNotificationsByCategory: (category) => {
        const { notifications } = get();
        return notifications.filter(n => n.category === category);
      },

      getNotificationsByPriority: (priority) => {
        const { notifications } = get();
        return notifications.filter(n => n.priority === priority);
      },

      cleanupExpired: () => {
        const now = new Date();
        set(state => ({
          notifications: state.notifications.filter(n => 
            !n.expiresAt || n.expiresAt > now || n.persistent
          )
        }));
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        settings: state.settings,
        // ✅ NO guardar notificaciones en localStorage - solo configuraciones
      }),
    }
  )
);

setInterval(() => {
  useNotificationStore.getState().cleanupExpired();
}, 30000);