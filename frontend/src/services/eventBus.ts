type EventCallback<T = any> = (data: T) => void;

interface EventMap {
  [key: string]: any;
}

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): () => void {
    if (!this.events.has(event as string)) {
      this.events.set(event as string, new Set());
    }
    
    const callbacks = this.events.get(event as string)!;
    callbacks.add(callback);

    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(event as string);
      }
    };
  }

  emit<K extends keyof EventMap>(event: K, data?: EventMap[K]): void {
    const callbacks = this.events.get(event as string);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${String(event)}:`, error);
        }
      });
    }
  }

  off<K extends keyof EventMap>(event: K, callback?: EventCallback<EventMap[K]>): void {
    const callbacks = this.events.get(event as string);
    if (callbacks) {
      if (callback) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.events.delete(event as string);
        }
      } else {
        this.events.delete(event as string);
      }
    }
  }

  once<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    const onceCallback = (data: EventMap[K]) => {
      callback(data);
      this.off(event, onceCallback);
    };
    
    this.on(event, onceCallback);
  }

  clear(): void {
    this.events.clear();
  }

  getListenerCount(event: keyof EventMap): number {
    const callbacks = this.events.get(event as string);
    return callbacks ? callbacks.size : 0;
  }
}

export const eventBus = new EventBus();

export type NotificationEvent = {
  'notification:show': {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'critical';
    category: 'system' | 'user' | 'appointment' | 'billing' | 'security';
    title: string;
    message?: string;
    duration?: number;
    persistent?: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
    actions?: Array<{
      label: string;
      action: () => void;
      style?: 'primary' | 'secondary' | 'danger';
    }>;
    metadata?: Record<string, any>;
  };
  'notification:dismiss': {
    id: string;
  };
  'notification:clear-all': {
    category?: string;
  };
  'notification:mark-read': {
    id: string;
  };
  'notification:mark-all-read': {
    category?: string;
  };
};

declare module './eventBus' {
  interface EventMap extends NotificationEvent {}
}