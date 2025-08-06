import { useNotificationStore, NotificationAction } from '@/stores/notificationStore';
import { eventBus } from './eventBus';

export interface CreateNotificationOptions {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'critical';
  category?: 'system' | 'user' | 'appointment' | 'billing' | 'security';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

export interface NotificationTemplateOptions {
  appointmentId?: string;
  clientName?: string;
  serviceName?: string;
  amount?: number;
  errorCode?: string;
  userId?: string;
  userName?: string;
  resourceName?: string;
}

class NotificationService {
  private store = useNotificationStore;

  private canReceiveNotifications(): boolean {
    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const user = authData.state?.user;
      return user?.role === 'owner';
    } catch (error) {
      return false;
    }
  }

  show(options: CreateNotificationOptions): string {
    // Para notificaciones automáticas del sistema en tiempo real, verificar si el usuario puede recibirlas
    if (options.category === 'appointment' && !this.canReceiveNotifications()) {
      return 'blocked-notification';
    }

    const notification = {
      type: options.type || 'info',
      category: options.category || 'user',
      priority: options.priority || 'medium',
      title: options.title,
      message: options.message,
      duration: options.duration,
      persistent: options.persistent,
      actions: options.actions,
      metadata: options.metadata,
    };

    return this.store.getState().addNotification(notification);
  }

  success(title: string, message?: string, options?: Partial<CreateNotificationOptions>): string {
    return this.show({
      ...options,
      title,
      message,
      type: 'success',
      priority: options?.priority || 'medium',
    });
  }

  error(title: string, message?: string, options?: Partial<CreateNotificationOptions>): string {
    return this.show({
      ...options,
      title,
      message,
      type: 'error',
      priority: options?.priority || 'high',
      persistent: options?.persistent ?? true,
    });
  }

  warning(title: string, message?: string, options?: Partial<CreateNotificationOptions>): string {
    return this.show({
      ...options,
      title,
      message,
      type: 'warning',
      priority: options?.priority || 'medium',
    });
  }

  info(title: string, message?: string, options?: Partial<CreateNotificationOptions>): string {
    return this.show({
      ...options,
      title,
      message,
      type: 'info',
      priority: options?.priority || 'low',
    });
  }

  critical(title: string, message?: string, options?: Partial<CreateNotificationOptions>): string {
    return this.show({
      ...options,
      title,
      message,
      type: 'critical',
      priority: 'critical',
      persistent: true,
      category: options?.category || 'system',
    });
  }

  appointmentCreated(options: NotificationTemplateOptions): string {
    return this.success(
      'Cita creada exitosamente',
      `Nueva cita ${options.serviceName ? `para ${options.serviceName}` : ''} ${options.clientName ? `con ${options.clientName}` : ''} ha sido programada.`,
      {
        category: 'appointment',
        priority: 'medium',
        metadata: {
          appointmentId: options.appointmentId,
          clientName: options.clientName,
          serviceName: options.serviceName,
        },
        actions: options.appointmentId ? [
          {
            label: 'Ver Cita',
            action: () => {
              window.location.href = `/appointments/${options.appointmentId}`;
            },
            style: 'primary',
          },
        ] : undefined,
      }
    );
  }

  appointmentCancelled(options: NotificationTemplateOptions): string {
    return this.warning(
      'Cita cancelada',
      `La cita ${options.serviceName ? `de ${options.serviceName}` : ''} ${options.clientName ? `con ${options.clientName}` : ''} ha sido cancelada.`,
      {
        category: 'appointment',
        priority: 'medium',
        metadata: {
          appointmentId: options.appointmentId,
          clientName: options.clientName,
          serviceName: options.serviceName,
        },
      }
    );
  }

  appointmentReminder(options: NotificationTemplateOptions): string {
    return this.info(
      'Recordatorio de cita',
      `Tienes una cita ${options.serviceName ? `de ${options.serviceName}` : ''} ${options.clientName ? `con ${options.clientName}` : ''} próximamente.`,
      {
        category: 'appointment',
        priority: 'high',
        persistent: true,
        metadata: {
          appointmentId: options.appointmentId,
          clientName: options.clientName,
          serviceName: options.serviceName,
        },
        actions: options.appointmentId ? [
          {
            label: 'Ver Detalles',
            action: () => {
              window.location.href = `/appointments/${options.appointmentId}`;
            },
            style: 'primary',
          },
          {
            label: 'Posponer',
            action: () => {
              this.info('Recordatorio pospuesto', 'Te recordaremos en 10 minutos.');
            },
            style: 'secondary',
          },
        ] : undefined,
      }
    );
  }

  paymentReceived(options: NotificationTemplateOptions): string {
    return this.success(
      'Pago recibido',
      `Se ha recibido un pago de ${options.amount ? `$${options.amount}` : 'monto pendiente'}.`,
      {
        category: 'billing',
        priority: 'medium',
        metadata: {
          amount: options.amount,
          clientName: options.clientName,
        },
      }
    );
  }

  paymentFailed(options: NotificationTemplateOptions): string {
    return this.error(
      'Error en el pago',
      `El pago ${options.amount ? `de $${options.amount}` : ''} no pudo ser procesado. ${options.errorCode ? `Código: ${options.errorCode}` : ''}`,
      {
        category: 'billing',
        priority: 'high',
        persistent: true,
        metadata: {
          amount: options.amount,
          errorCode: options.errorCode,
          clientName: options.clientName,
        },
        actions: [
          {
            label: 'Reintentar Pago',
            action: () => {
              this.info('Procesando...', 'Reintentando el pago.');
            },
            style: 'primary',
          },
          {
            label: 'Contactar Soporte',
            action: () => {
              window.open('mailto:soporte@bookflow.com', '_blank');
            },
            style: 'secondary',
          },
        ],
      }
    );
  }

  userLogin(options: NotificationTemplateOptions): string {
    return this.success(
      `¡Bienvenido${options.userName ? `, ${options.userName}` : ''}!`,
      'Has iniciado sesión exitosamente en BookFlow.',
      {
        category: 'user',
        priority: 'low',
        duration: 3000,
        metadata: {
          userId: options.userId,
          userName: options.userName,
        },
      }
    );
  }

  securityAlert(title: string, message: string, options?: NotificationTemplateOptions): string {
    return this.critical(
      title,
      message,
      {
        category: 'security',
        metadata: {
          userId: options?.userId,
          userName: options?.userName,
        },
        actions: [
          {
            label: 'Revisar Seguridad',
            action: () => {
              window.location.href = '/settings/security';
            },
            style: 'danger',
          },
        ],
      }
    );
  }

  systemError(title: string, message: string, errorCode?: string): string {
    return this.error(
      title,
      message,
      {
        category: 'system',
        priority: 'high',
        persistent: true,
        metadata: {
          errorCode,
          timestamp: new Date().toISOString(),
        },
        actions: [
          {
            label: 'Reportar Error',
            action: () => {
              this.info('Error reportado', 'Gracias por reportar este error.');
            },
            style: 'primary',
          },
        ],
      }
    );
  }

  resourceUnavailable(options: NotificationTemplateOptions): string {
    return this.warning(
      'Recurso no disponible',
      `El recurso ${options.resourceName || 'solicitado'} no está disponible en este momento.`,
      {
        category: 'system',
        priority: 'medium',
        metadata: {
          resourceName: options.resourceName,
        },
        actions: [
          {
            label: 'Ver Alternativas',
            action: () => {
              window.location.href = '/resources';
            },
            style: 'primary',
          },
        ],
      }
    );
  }

  bulkOperation(
    operation: string,
    total: number,
    successful: number
  ): string {
    const failed = total - successful;
    const isComplete = failed === 0;
    
    const title = isComplete 
      ? `${operation} completada`
      : `${operation} completada parcialmente`;
    
    const message = isComplete
      ? `Se procesaron ${successful} elemento${successful !== 1 ? 's' : ''} exitosamente.`
      : `Se procesaron ${successful} de ${total} elementos. ${failed} fallaron.`;

    return this.show({
      type: isComplete ? 'success' : failed > successful ? 'error' : 'warning',
      title,
      message,
      category: 'system',
      priority: isComplete ? 'medium' : 'high',
      metadata: {
        operation,
        total,
        successful,
        failed,
      },
    });
  }

  dismiss(id: string): void {
    this.store.getState().dismissNotification(id);
  }

  markAsRead(id: string): void {
    this.store.getState().markAsRead(id);
  }

  clearAll(category?: string): void {
    this.store.getState().clearAll(category);
  }

  getUnreadCount(category?: string): number {
    return this.store.getState().getUnreadCount(category);
  }

  enableCategory(category: 'system' | 'user' | 'appointment' | 'billing' | 'security'): void {
    const currentSettings = this.store.getState().settings;
    this.store.getState().updateSettings({
      categories: {
        ...currentSettings.categories,
        [category]: true,
      },
    });
  }

  disableCategory(category: 'system' | 'user' | 'appointment' | 'billing' | 'security'): void {
    const currentSettings = this.store.getState().settings;
    this.store.getState().updateSettings({
      categories: {
        ...currentSettings.categories,
        [category]: false,
      },
    });
  }

  updateSettings(settings: Partial<import('@/stores/notificationStore').NotificationSettings>): void {
    this.store.getState().updateSettings(settings);
  }

  subscribeTo<T extends keyof import('./eventBus').NotificationEvent>(
    event: T,
    callback: (data: import('./eventBus').NotificationEvent[T]) => void
  ): () => void {
    return eventBus.on(event, callback);
  }
}

export const notificationService = new NotificationService();

// 🔍 DEBUG: Exponer funciones de test globalmente
if (typeof window !== 'undefined') {
  (window as any).testNotification = () => {
    console.log('🧪 Testing notification system...');
    const id = notificationService.success(
      'Test Notification',
      'Esta es una notificación de prueba para verificar que el sistema funciona correctamente.',
      {
        category: 'system',
        priority: 'high',
        duration: 5000,
        persistent: false
      }
    );
    console.log('🧪 Test notification created with ID:', id);
    return id;
  };

  (window as any).testRealTimeNotification = () => {
    console.log('🧪 Testing real-time notification...');
    const id = notificationService.success(
      'Nueva cita agendada (TEST)',
      'Juan Pérez ha agendado una cita para Consulta Médica',
      {
        category: 'appointment',
        priority: 'high',
        persistent: false,
        duration: 8000,
        metadata: {
          appointmentId: 'test-123',
          clientName: 'Juan Pérez',
          serviceName: 'Consulta Médica',
          isFromRealTime: true,
          receivedAt: new Date().toISOString(),
        }
      }
    );
    console.log('🧪 Test real-time notification created with ID:', id);
    return id;
  };

  (window as any).debugNotificationStore = () => {
    const state = notificationService.store.getState();
    console.log('🔍 Notification Store Debug:', {
      notifications: state.notifications,
      settings: state.settings,
      queue: state.queue
    });
    return state;
  };
}

export default notificationService;