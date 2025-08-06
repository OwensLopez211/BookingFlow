import { notificationService } from './notificationService';
import { eventBus } from './eventBus';
import { useNotificationStore } from '@/stores/notificationStore';

interface RealTimeNotificationEvent {
  type: 'appointment_created' | 'appointment_updated' | 'appointment_cancelled' | 'system_notification';
  data: {
    appointmentId?: string;
    clientName?: string;
    serviceName?: string;
    professionalName?: string;
    date?: string;
    time?: string;
    orgId?: string;
    title: string;
    message?: string;
    category?: 'appointment' | 'system' | 'user' | 'billing' | 'security';
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };
  timestamp: string;
}

class RealTimeNotificationService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000; // Start with 1 second
  private isConnected = false;
  private orgId: string | null = null;

  private listeners: Set<(event: RealTimeNotificationEvent) => void> = new Set();
  private processedNotifications: Set<string> = new Set(); // ✅ Para evitar duplicados

  constructor() {
    // Mantener solo el listener de eventos personalizados como fallback
    window.addEventListener('realtime-notification', ((event: CustomEvent<RealTimeNotificationEvent>) => {
      this.handleNotification(event.detail);
    }) as EventListener);
  }

  async connect(orgId: string) {
    // ✅ Evitar conexiones duplicadas
    if (this.isConnected && this.orgId === orgId) {
      console.log('⏭️ Already connected to org:', orgId, '- skipping duplicate connection');
      return;
    }

    // ✅ Desconectar conexión anterior si existe
    if (this.eventSource) {
      console.log('🔄 Disconnecting previous SSE connection');
      this.disconnect();
    }

    this.orgId = orgId;
    
    console.log('🔄 Connecting to real-time notifications (SSE only) for org:', orgId);
    
    // ✅ SOLO conectar a SSE para notificaciones en tiempo real
    // El historial lo maneja directamente el dropdown con useBackendNotifications
    this.connectSSE(orgId);
  }

  // ✅ DESACTIVADO: El historial se maneja directamente en useBackendNotifications
  private async syncWithBackendHistoryDISABLED(orgId: string) {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Get auth token
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.log('❌ No auth token available for syncing notifications');
        return;
      }

      // Fetch notifications from backend
      const response = await fetch(`${API_BASE_URL}/v1/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log('❌ Failed to fetch notifications from backend:', response.status);
        return;
      }

      const responseData = await response.json();
      const backendNotifications = responseData.notifications || [];
      console.log(`📥 Fetched ${backendNotifications.length} notifications from backend`);

      // Verificar que backendNotifications sea un array válido
      if (!Array.isArray(backendNotifications)) {
        console.log('📥 No notifications array received from backend, skipping sync');
        return;
      }

      // Convert backend notifications to frontend format and sync with store
      const notificationStore = useNotificationStore.getState();
      const currentNotifications = notificationStore.notifications;
      
      // Create a map of existing notifications by their IDs and appointment IDs to avoid duplicates
      const existingIds = new Set();
      const existingAppointmentIds = new Set();
      
      currentNotifications.forEach(n => {
        // Add backend IDs if they exist
        if (n.metadata?.backendId) {
          existingIds.add(n.metadata.backendId);
        }
        // Add frontend notification IDs
        existingIds.add(n.id);
        // Track appointment IDs to avoid duplicates
        if (n.metadata?.appointmentId) {
          existingAppointmentIds.add(n.metadata.appointmentId);
        }
      });

      // Add only new notifications from backend
      let syncedCount = 0;
      for (const backendNotif of backendNotifications) {
        const appointmentId = backendNotif.data?.appointmentId;
        
        // Skip if we already have this backend notification ID
        if (existingIds.has(backendNotif.id)) {
          continue;
        }
        
        // Skip if we already have a notification for this appointment (avoid real-time duplicates)
        if (appointmentId && existingAppointmentIds.has(appointmentId)) {
          console.log(`⏭️ Skipping backend notification for appointment ${appointmentId} - already exists in real-time notifications`);
          continue;
        }

        // ✅ También verificar por timestamp para evitar duplicados exactos
        const backendTimestamp = new Date(backendNotif.createdAt).getTime();
        const isDuplicate = currentNotifications.some(n => 
          n.metadata?.appointmentId === appointmentId &&
          Math.abs(new Date(n.createdAt).getTime() - backendTimestamp) < 60000 // 1 minuto de diferencia
        );
        
        if (isDuplicate) {
          console.log(`⏭️ Skipping backend notification - already exists with similar timestamp`);
          continue;
        }

        // Convert backend notification to frontend format
        const frontendNotification = this.convertBackendToFrontend(backendNotif);
        if (frontendNotification) {
          // ✅ Agregar al historial SIN mostrar toast (silencioso)
          notificationStore.addNotificationSilently(frontendNotification);
          syncedCount++;
          
          // Track this appointment ID to prevent future duplicates
          if (appointmentId) {
            existingAppointmentIds.add(appointmentId);
          }
        }
      }

      if (syncedCount > 0) {
        console.log(`✅ Synced ${syncedCount} new notifications from backend`);
      }

    } catch (error) {
      console.error('❌ Error syncing with backend notification history:', error);
    }
  }

  // ✅ DESACTIVADO: Ya no convertimos notificaciones del backend
  private convertBackendToFrontendDISABLED(backendNotif: any) {
    try {
      const data = backendNotif.data;
      
      return {
        type: this.mapBackendTypeToFrontend(backendNotif.type),
        category: data.category || 'appointment',
        title: data.title || 'Notification',
        message: data.message,
        priority: data.priority || 'medium',
        persistent: true, // Backend notifications are always persistent in history
        metadata: {
          ...data,
          backendId: backendNotif.id,
          createdAt: backendNotif.createdAt, // ✅ Hora real de creación
          isFromBackend: true,
          isRead: backendNotif.isRead || false // ✅ Estado leído del backend
        }
      };
    } catch (error) {
      console.error('Error converting backend notification:', error);
      return null;
    }
  }

  private mapBackendTypeToFrontend(backendType: string): 'success' | 'error' | 'warning' | 'info' | 'critical' {
    switch (backendType) {
      case 'appointment_created': return 'success';
      case 'appointment_updated': return 'info';
      case 'appointment_cancelled': return 'warning';
      case 'system_notification': return 'info';
      default: return 'info';
    }
  }

  private connectSSE(orgId: string) {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Get auth token for SSE connection
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.log('❌ No auth token available for SSE connection');
        return;
      }

      // Create SSE connection with auth token as query parameter
      const url = `${API_BASE_URL}/v1/notifications/stream/${orgId}?token=${encodeURIComponent(token)}`;
      this.eventSource = new EventSource(url);
      
      this.eventSource.onopen = () => {
        console.log('✅ SSE connection established for org:', orgId);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const notification: RealTimeNotificationEvent = JSON.parse(event.data);
          
          console.log('📡 Received SSE message:', { type: notification.type, data: notification.data });
          
          // Skip ping messages but log them
          if (notification.type === 'ping' || notification.type === 'connection_established') {
            console.log('💓 SSE ping/connection message:', notification.type);
            return;
          }
          
          console.log('🔄 Processing SSE notification:', notification);
          this.handleNotification(notification);
        } catch (error) {
          console.error('❌ Error parsing SSE notification:', error, 'Raw data:', event.data);
        }
      };

      this.eventSource.onerror = (error) => {
        console.log('❌ SSE connection failed, will retry...');
        this.isConnected = false;
        this.eventSource?.close();
        this.eventSource = null;
        this.scheduleReconnect();
      };

    } catch (error) {
      console.log('❌ Error establishing SSE connection');
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    setTimeout(() => {
      if (this.orgId) {
        this.reconnectAttempts++;
        this.reconnectInterval = Math.min(this.reconnectInterval * 2, 30000); // Max 30 seconds
        this.connectSSE(this.orgId);
      }
    }, this.reconnectInterval);
  }

  private handleNotification(notification: RealTimeNotificationEvent) {
    console.log('🔔 Handling notification:', notification);
    
    // Verificar si el usuario actual es owner antes de procesar
    const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const user = authData.state?.user;
    
    console.log('👤 Current user:', { role: user?.role, email: user?.email });
    
    if (!user || user.role !== 'owner') {
      console.log('❌ User is not owner, skipping notification');
      return;
    }

    // ✅ Verificar duplicados basado en appointmentId y timestamp
    const notificationKey = `${notification.type}_${notification.data.appointmentId}_${notification.timestamp}`;
    if (this.processedNotifications.has(notificationKey)) {
      console.log('⏭️ Notification already processed, skipping:', notificationKey);
      return;
    }
    this.processedNotifications.add(notificationKey);

    console.log('✅ User is owner, processing notification');

    // Notificar a todos los listeners
    console.log(`📢 Notifying ${this.listeners.size} listeners`);
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });

    // ✅ Disparar evento para que el dropdown se actualice
    if (typeof window !== 'undefined') {
      console.log('📡 [realTimeNotificationService] Dispatching realtime-notification-received event');
      console.log('📡 [realTimeNotificationService] Event detail:', notification);
      console.log('📡 [realTimeNotificationService] Current window event listeners count:', Object.getOwnPropertyNames(window).filter(prop => prop.includes('event')).length);
      
      const customEvent = new CustomEvent('realtime-notification-received', {
        detail: notification
      });
      
      console.log('📡 [realTimeNotificationService] CustomEvent created:', customEvent);
      window.dispatchEvent(customEvent);
      console.log('📡 [realTimeNotificationService] Event dispatched successfully');
    }

    // Convertir a notificación del sistema (toast)
    this.convertToSystemNotification(notification);
  }

  private convertToSystemNotification(event: RealTimeNotificationEvent) {
    const { type, data } = event;

    console.log('🔄 Converting real-time notification to system notification:', { type, data });
    
    // ✅ Importar dinámicamente el notificationService solo cuando sea necesario
    import('@/services/notificationService').then(({ notificationService }) => {
      switch (type) {
        case 'appointment_created':
          const notificationId = notificationService.success(
            'Nueva cita pendiente de confirmación',
            `${data.clientName} ha solicitado una cita para ${data.serviceName} - Pendiente de confirmación`,
            {
              category: 'appointment',
              priority: 'high',
              persistent: false, // ✅ NO persistente - se desaparece automáticamente
              duration: 8000, // ✅ Se oculta después de 8 segundos
              metadata: {
                appointmentId: data.appointmentId,
                clientName: data.clientName,
                serviceName: data.serviceName,
                date: data.date,
                time: data.time,
                isFromRealTime: true,
                receivedAt: new Date().toISOString(),
              },
              actions: data.appointmentId ? [
                {
                  label: 'Ver Cita',
                  action: () => {
                    // En producción, esto navegaría a la página de citas
                    console.log('Ver cita:', data.appointmentId);
                  },
                  style: 'primary',
                },
              ] : undefined,
            }
          );
          console.log('✅ Created appointment notification with ID:', notificationId);
          break;

        case 'appointment_updated':
          const updateId = notificationService.info(
            data.title,
            data.message,
            {
              category: 'appointment',
              priority: data.priority || 'medium',
              persistent: false,
              duration: 6000,
              metadata: {
                appointmentId: data.appointmentId,
                clientName: data.clientName,
                serviceName: data.serviceName,
                isFromRealTime: true,
                receivedAt: new Date().toISOString(),
              }
            }
          );
          console.log('✅ Created appointment update notification with ID:', updateId);
          break;

        case 'appointment_cancelled':
          const cancelId = notificationService.warning(
            'Cita cancelada',
            `${data.clientName} ha cancelado su cita para ${data.serviceName}`,
            {
              category: 'appointment',
              priority: 'high',
              persistent: false,
              duration: 10000,
              metadata: {
                appointmentId: data.appointmentId,
                clientName: data.clientName,
                serviceName: data.serviceName,
                isFromRealTime: true,
                receivedAt: new Date().toISOString(),
              }
            }
          );
          console.log('✅ Created appointment cancellation notification with ID:', cancelId);
          break;

        case 'system_notification':
          const systemId = notificationService.show({
            title: data.title,
            message: data.message,
            type: 'info',
            category: data.category || 'system',
            priority: data.priority || 'medium',
            persistent: data.priority === 'critical' || data.priority === 'high',
            duration: data.priority === 'critical' || data.priority === 'high' ? undefined : 5000,
            metadata: {
              isFromRealTime: true,
              receivedAt: new Date().toISOString(),
            }
          });
          console.log('✅ Created system notification with ID:', systemId);
          break;

        default:
          console.warn('⚠️ Unknown notification type:', type);
      }
    }).catch(error => {
      console.error('❌ Error importing notificationService:', error);
    });
  }

  // Método para enviar notificaciones al servidor
  sendNotification(notification: Omit<RealTimeNotificationEvent, 'timestamp'>) {
    const fullNotification: RealTimeNotificationEvent = {
      ...notification,
      timestamp: new Date().toISOString(),
    };

    // Enviar al servidor para que las distribuya via SSE
    this.sendToServer(fullNotification);
  }

  private async sendToServer(notification: RealTimeNotificationEvent) {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/v1/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(notification),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      // Si falla el envío al servidor, fallback a evento local para desarrollo
      console.log('📡 Server not available, using local event fallback');
      window.dispatchEvent(new CustomEvent('realtime-notification', {
        detail: notification
      }));
    }
  }

  // Notificar cita creada
  notifyAppointmentCreated(data: {
    appointmentId: string;
    clientName: string;
    serviceName: string;
    professionalName?: string;
    date: string;
    time: string;
    orgId: string;
  }) {
    this.sendNotification({
      type: 'appointment_created',
      data: {
        ...data,
        title: 'Nueva cita agendada',
        message: `${data.clientName} ha agendado una cita para ${data.serviceName}`,
        category: 'appointment',
        priority: 'medium',
      }
    });
  }

  // Método para marcar notificación como leída en backend
  async markAsReadInBackend(notificationId: string) {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Get auth token
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.log('❌ No auth token available for marking notification as read');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`✅ Marked notification ${notificationId} as read in backend`);
      }
    } catch (error) {
      console.error('❌ Error marking notification as read in backend:', error);
    }
  }

  // Método para marcar todas las notificaciones como leídas en backend
  async markAllAsReadInBackend() {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Get auth token
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.log('❌ No auth token available for marking all notifications as read');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/v1/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Marked all notifications as read in backend');
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read in backend:', error);
    }
  }

  // Método para añadir listeners personalizados
  addListener(listener: (event: RealTimeNotificationEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.orgId = null;
    // ✅ Limpiar notificaciones procesadas al desconectar
    this.processedNotifications.clear();
  }

  isConnectedToOrg(orgId: string): boolean {
    return this.isConnected && this.orgId === orgId;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      orgId: this.orgId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // ✅ DESACTIVADO: Ya no sincronizamos con el backend
  async forceSyncWithBackendDISABLED() {
    console.log('⚠️ Sync with backend is disabled. Use useBackendNotifications hook instead.');
  }

  // Debug method to help troubleshoot from browser console
  debug() {
    const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const user = authData.state?.user;
    const notificationStore = useNotificationStore.getState();
    
    console.log('🔍 Notification System Debug Info:');
    console.log('================================');
    console.log('🔧 Connection Status:', this.getConnectionStatus());
    console.log('👤 Current User:', { 
      email: user?.email, 
      role: user?.role, 
      orgId: user?.orgId 
    });
    console.log('📊 Notification Store:', {
      totalNotifications: notificationStore.notifications.length,
      unreadCount: notificationStore.getUnreadCount(),
      notifications: notificationStore.notifications.map(n => ({
        id: n.id,
        title: n.title,
        isRead: n.isRead,
        category: n.category,
        createdAt: n.createdAt,
        metadata: n.metadata
      }))
    });
    console.log('🔗 SSE EventSource:', this.eventSource);
    console.log('👂 Listeners Count:', this.listeners.size);
    console.log('================================');
    
    return {
      connection: this.getConnectionStatus(),
      user: { email: user?.email, role: user?.role, orgId: user?.orgId },
      store: {
        total: notificationStore.notifications.length,
        unread: notificationStore.getUnreadCount()
      },
      eventSource: !!this.eventSource,
      listeners: this.listeners.size
    };
  }
}

export const realTimeNotificationService = new RealTimeNotificationService();

// Exponer globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).debugNotifications = () => realTimeNotificationService.debug();
  (window as any).forceSync = () => realTimeNotificationService.forceSyncWithBackendDISABLED();
  (window as any).realTimeNotificationService = realTimeNotificationService;
  (window as any).forceConnect = () => {
    const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const user = authData.state?.user;
    if (user?.orgId) {
      console.log('🔗 Force connecting to org:', user.orgId);
      return realTimeNotificationService.connect(user.orgId);
    } else {
      console.log('❌ No orgId found for force connect');
    }
  };
  
  // ✅ Función para limpiar localStorage de notificaciones viejas
  (window as any).clearNotificationStorage = () => {
    const storage = localStorage.getItem('notification-storage');
    if (storage) {
      const parsed = JSON.parse(storage);
      // Solo mantener settings, remover notifications
      const cleaned = {
        state: {
          settings: parsed.state?.settings || {},
        },
        version: parsed.version || 0
      };
      localStorage.setItem('notification-storage', JSON.stringify(cleaned));
      console.log('✅ Notification storage cleaned');
      window.location.reload();
    }
  };
}

export default realTimeNotificationService;