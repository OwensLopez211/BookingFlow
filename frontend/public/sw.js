// Updated: 2025-08-08T06:43:09.247Z
// BookFlow Service Worker
const VERSION = '0.0.0'; // Se actualizará automáticamente durante el build
const CACHE_NAME = `bookflow-v${VERSION}`;
const OFFLINE_URL = '/offline.html';

// Configuración de limpieza automática
const CACHE_EXPIRATION_DAYS = 7; // Días antes de considerar un caché como obsoleto
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB máximo de caché

// Assets to cache for offline functionality
const CACHE_ASSETS = [
  '/',
  '/offline.html',
  '/bookingflowlogo.png',
  '/miniatura.webp',
  '/manifest.json'
];


// Utilidades de limpieza de caché
const cleanupExpiredCaches = async () => {
  try {
    const cacheNames = await caches.keys();
    const now = Date.now();
    
    const deletePromises = cacheNames.map(async (cacheName) => {
      if (cacheName === CACHE_NAME) return; // No borrar el caché actual
      
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        if (keys.length === 0) {
          console.log('[SW] Deleting empty cache:', cacheName);
          return caches.delete(cacheName);
        }
        
        // Verificar si el caché es muy antiguo
        const cacheAge = await getCacheAge(cache);
        const maxAge = CACHE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
        
        if (cacheAge > maxAge) {
          console.log('[SW] Deleting expired cache:', cacheName, `(${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days old)`);
          return caches.delete(cacheName);
        }
      } catch (error) {
        console.warn('[SW] Error checking cache age for:', cacheName, error);
        // Si hay error al acceder al caché, mejor borrarlo
        return caches.delete(cacheName);
      }
    });
    
    await Promise.all(deletePromises);
    console.log('[SW] Cache cleanup completed');
  } catch (error) {
    console.error('[SW] Error during cache cleanup:', error);
  }
};

const getCacheAge = async (cache) => {
  try {
    const keys = await cache.keys();
    if (keys.length === 0) return Infinity;
    
    // Usar la fecha de la primera entrada como referencia
    const response = await cache.match(keys[0]);
    const dateHeader = response?.headers.get('date');
    
    if (dateHeader) {
      return Date.now() - new Date(dateHeader).getTime();
    }
    
    // Si no hay fecha, asumir que es antiguo
    return CACHE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000 + 1;
  } catch {
    return Infinity;
  }
};

const manageCacheSize = async () => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    if (keys.length === 0) return;
    
    // Estimar tamaño del caché
    let totalSize = 0;
    const sizePromises = keys.map(async (request) => {
      try {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.clone().blob();
          return blob.size;
        }
      } catch {
        return 0;
      }
      return 0;
    });
    
    const sizes = await Promise.all(sizePromises);
    totalSize = sizes.reduce((acc, size) => acc + size, 0);
    
    console.log('[SW] Current cache size:', Math.round(totalSize / (1024 * 1024)), 'MB');
    
    if (totalSize > MAX_CACHE_SIZE) {
      console.log('[SW] Cache size exceeded, cleaning up old entries');
      
      // Ordenar por antigüedad y borrar los más antiguos
      const entriesWithDates = await Promise.all(
        keys.map(async (request) => {
          try {
            const response = await cache.match(request);
            const dateHeader = response?.headers.get('date');
            return {
              request,
              date: dateHeader ? new Date(dateHeader).getTime() : 0
            };
          } catch {
            return { request, date: 0 };
          }
        })
      );
      
      // Ordenar del más antiguo al más nuevo
      entriesWithDates.sort((a, b) => a.date - b.date);
      
      // Borrar el 30% más antiguo
      const toDelete = Math.floor(entriesWithDates.length * 0.3);
      const deletePromises = entriesWithDates.slice(0, toDelete).map(entry => 
        cache.delete(entry.request)
      );
      
      await Promise.all(deletePromises);
      console.log(`[SW] Deleted ${toDelete} old cache entries`);
    }
  } catch (error) {
    console.error('[SW] Error managing cache size:', error);
  }
};

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    Promise.all([
      cleanupExpiredCaches(),
      manageCacheSize(),
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service worker activated and caches cleaned');
    }).catch((error) => {
      console.error('[SW] Error during activation:', error);
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, serve offline page
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Handle asset requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Try to fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache successful responses for static assets
            const url = new URL(event.request.url);
            if (
              url.pathname.endsWith('.js') ||
              url.pathname.endsWith('.css') ||
              url.pathname.endsWith('.png') ||
              url.pathname.endsWith('.jpg') ||
              url.pathname.endsWith('.jpeg') ||
              url.pathname.endsWith('.webp') ||
              url.pathname.endsWith('.svg')
            ) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Return a default offline response for failed requests
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message: 'No hay conexión a internet. Algunas funciones pueden no estar disponibles.'
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
          });
      })
  );
});

// Background sync for offline actions (future implementation)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Future: sync offline actions when connection is restored
      console.log('[SW] Background sync completed')
    );
  }
});

// Push notifications (future implementation)
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de BookFlow',
    icon: '/bookingflowlogo.png',
    badge: '/miniatura.webp',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/bookingflowlogo.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/miniatura.webp'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('BookFlow', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    );
  }
});

// Limpieza periódica de caché (cada hora)
const schedulePeriodicCleanup = () => {
  setInterval(async () => {
    console.log('[SW] Running periodic cache cleanup');
    await cleanupExpiredCaches();
    await manageCacheSize();
    await cleanupBrowserStorage();
  }, 60 * 60 * 1000); // Cada hora
};

// Limpieza de localStorage y sessionStorage obsoleto
const cleanupBrowserStorage = async () => {
  try {
    // Obtener todos los clientes (pestañas abiertas)
    const clients = await self.clients.matchAll();
    
    if (clients.length > 0) {
      // Enviar mensaje a todos los clientes para que limpien su storage
      clients.forEach(client => {
        client.postMessage({
          type: 'CLEANUP_STORAGE',
          version: VERSION
        });
      });
    }
  } catch (error) {
    console.error('[SW] Error cleaning browser storage:', error);
  }
};

// Detectar actualizaciones de la aplicación
const checkForAppUpdates = async () => {
  try {
    const response = await fetch('/package.json', {
      cache: 'no-cache'
    });
    
    if (response.ok) {
      const packageInfo = await response.json();
      const currentVersion = packageInfo.version;
      
      if (currentVersion !== VERSION) {
        console.log('[SW] New app version detected:', currentVersion, 'Current:', VERSION);
        
        // Limpiar todos los cachés para forzar actualización
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        
        // Notificar a los clientes sobre la actualización
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'APP_UPDATE_AVAILABLE',
            newVersion: currentVersion,
            currentVersion: VERSION
          });
        });
      }
    }
  } catch (error) {
    console.warn('[SW] Could not check for app updates:', error);
  }
};

// Inicializar limpieza periódica después de la instalación
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Essential assets cached');
        schedulePeriodicCleanup();
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache assets:', error);
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CHECK_UPDATES') {
    checkForAppUpdates();
  } else if (event.data && event.data.type === 'FORCE_CACHE_CLEANUP') {
    Promise.all([
      cleanupExpiredCaches(),
      manageCacheSize(),
      cleanupBrowserStorage()
    ]).then(() => {
      event.ports[0]?.postMessage({ success: true });
    }).catch((error) => {
      console.error('[SW] Error during forced cleanup:', error);
      event.ports[0]?.postMessage({ success: false, error: error.message });
    });
  }
});