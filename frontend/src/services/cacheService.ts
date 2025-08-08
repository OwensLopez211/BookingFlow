/**
 * Servicio de gestión automática de caché
 * Maneja la limpieza automática de caché del service worker y del browser storage
 */

interface CacheConfig {
  maxAge: number; // Edad máxima en millisegundos
  storageKeys: string[]; // Keys específicas de localStorage que deben limpiarse
}

class CacheService {
  private config: CacheConfig;
  private lastCleanup: number = 0;
  private cleanupInterval: number = 60 * 60 * 1000; // 1 hora
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días por defecto
      storageKeys: [
        'auth-token',
        'user-preferences',
        'app-settings',
        'temp-data',
        'session-data'
      ],
      ...config
    };

    this.init();
  }

  private async init() {
    // Registrar listeners para mensajes del service worker
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
        
        // Programar limpieza inicial
        setTimeout(() => this.performCleanup(), 5000); // 5 segundos después de cargar
        
        // Programar limpieza periódica
        setInterval(() => this.performCleanup(), this.cleanupInterval);
        
        console.log('[CacheService] Initialized successfully');
      } catch (error) {
        console.warn('[CacheService] Service worker not available:', error);
      }
    }

    // Limpiar al cargar la página
    this.cleanupBrowserStorage();
    
    // Limpiar al cerrar la página
    window.addEventListener('beforeunload', () => {
      this.cleanupBrowserStorage();
    });
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    const { data } = event;
    
    switch (data.type) {
      case 'CLEANUP_STORAGE':
        this.cleanupBrowserStorage();
        break;
        
      case 'APP_UPDATE_AVAILABLE':
        this.handleAppUpdate(data.newVersion, data.currentVersion);
        break;
        
      default:
        console.log('[CacheService] Unknown message from SW:', data);
    }
  }

  private async performCleanup() {
    const now = Date.now();
    
    // Evitar limpiezas muy frecuentes
    if (now - this.lastCleanup < this.cleanupInterval) {
      return;
    }

    this.lastCleanup = now;
    
    try {
      // Limpiar browser storage
      this.cleanupBrowserStorage();
      
      // Solicitar limpieza de caché al service worker
      if (this.serviceWorkerRegistration) {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log('[CacheService] Cache cleanup completed successfully');
          } else {
            console.warn('[CacheService] Cache cleanup failed:', event.data.error);
          }
        };
        
        this.serviceWorkerRegistration.active?.postMessage({
          type: 'FORCE_CACHE_CLEANUP'
        }, [messageChannel.port2]);
      }
    } catch (error) {
      console.error('[CacheService] Error during cleanup:', error);
    }
  }

  private cleanupBrowserStorage() {
    try {
      // Limpiar localStorage
      this.cleanupStorage(localStorage, 'localStorage');
      
      // Limpiar sessionStorage
      this.cleanupStorage(sessionStorage, 'sessionStorage');
      
      console.log('[CacheService] Browser storage cleanup completed');
    } catch (error) {
      console.error('[CacheService] Error cleaning browser storage:', error);
    }
  }

  private cleanupStorage(storage: Storage, storageName: string) {
    const keysToRemove: string[] = [];
    
    // Revisar todas las keys del storage
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key) continue;
      
      try {
        const item = storage.getItem(key);
        if (!item) {
          keysToRemove.push(key);
          continue;
        }
        
        // Intentar parsear como JSON para verificar si tiene timestamp
        let data: any;
        try {
          data = JSON.parse(item);
        } catch {
          // Si no es JSON válido, verificar si la key está en la lista de limpieza
          if (this.shouldCleanupKey(key)) {
            keysToRemove.push(key);
          }
          continue;
        }
        
        // Si tiene timestamp, verificar si es muy antiguo
        if (data && typeof data === 'object' && data.timestamp) {
          const age = Date.now() - data.timestamp;
          if (age > this.config.maxAge) {
            keysToRemove.push(key);
          }
        }
        // Si la key está en la lista de limpieza automática
        else if (this.shouldCleanupKey(key)) {
          keysToRemove.push(key);
        }
      } catch (error) {
        console.warn(`[CacheService] Error processing ${storageName} key "${key}":`, error);
        // Si hay error accediendo a la key, marcarla para borrado
        keysToRemove.push(key);
      }
    }
    
    // Remover keys marcadas
    keysToRemove.forEach(key => {
      try {
        storage.removeItem(key);
        console.log(`[CacheService] Removed expired ${storageName} key: ${key}`);
      } catch (error) {
        console.warn(`[CacheService] Error removing ${storageName} key "${key}":`, error);
      }
    });
  }

  private shouldCleanupKey(key: string): boolean {
    return this.config.storageKeys.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(key);
      }
      return key.includes(pattern) || key.startsWith(pattern);
    });
  }

  private handleAppUpdate(newVersion: string, _currentVersion: string) {
    console.log('[CacheService] App update detected:', newVersion);
    
    // Mostrar notificación al usuario
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('BookFlow Actualizado', {
        body: `Nueva versión disponible: ${newVersion}. Recarga la página para actualizar.`,
        icon: '/bookingflowlogo.png',
        tag: 'app-update'
      });
    }
    
    // Opcionalmente recargar automáticamente después de un delay
    setTimeout(() => {
      if (confirm(`Nueva versión de BookFlow disponible (${newVersion}). ¿Deseas recargar la página para actualizar?`)) {
        window.location.reload();
      }
    }, 3000);
  }

  // Métodos públicos para uso manual
  public async forceCleanup(): Promise<boolean> {
    try {
      await this.performCleanup();
      return true;
    } catch (error) {
      console.error('[CacheService] Error during forced cleanup:', error);
      return false;
    }
  }

  public async checkForUpdates(): Promise<void> {
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage({
        type: 'CHECK_UPDATES'
      });
    }
  }

  public getConfig(): CacheConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[CacheService] Configuration updated:', this.config);
  }

  // Método para almacenar datos con timestamp automático
  public setWithTimestamp(key: string, data: any, storage: Storage = localStorage): void {
    try {
      const itemWithTimestamp = {
        data,
        timestamp: Date.now()
      };
      storage.setItem(key, JSON.stringify(itemWithTimestamp));
    } catch (error) {
      console.error('[CacheService] Error storing data with timestamp:', error);
    }
  }

  // Método para obtener datos verificando timestamp
  public getWithTimestamp(key: string, storage: Storage = localStorage): any | null {
    try {
      const item = storage.getItem(key);
      if (!item) return null;
      
      const parsedItem = JSON.parse(item);
      if (!parsedItem.timestamp) return parsedItem; // Retrocompatibilidad
      
      const age = Date.now() - parsedItem.timestamp;
      if (age > this.config.maxAge) {
        storage.removeItem(key);
        return null;
      }
      
      return parsedItem.data;
    } catch (error) {
      console.error('[CacheService] Error getting data with timestamp:', error);
      return null;
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();
export default CacheService;