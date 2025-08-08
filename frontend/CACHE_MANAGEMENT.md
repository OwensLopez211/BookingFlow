# Sistema de Gestión Automática de Caché - BookFlow

Este documento describe el sistema implementado para la limpieza automática de caché, eliminando la necesidad de que los usuarios limpien el caché manualmente.

## ✨ Características Principales

### 🔄 Limpieza Automática
- **Limpieza periódica**: Cada hora se ejecuta una limpieza automática
- **Gestión de tamaño**: El caché se mantiene bajo 50MB automáticamente
- **Limpieza por edad**: Los cachés de más de 7 días se eliminan automáticamente
- **Detección de versiones**: Limpieza automática cuando hay nuevas versiones de la app

### 🛠️ Componentes del Sistema

#### 1. Service Worker Mejorado (`/public/sw.js`)
- **Versionado automático**: La versión se actualiza automáticamente durante el build
- **Limpieza inteligente**: Algoritmos para mantener solo el caché necesario
- **Gestión de tamaño**: Control automático del tamaño del caché
- **Limpieza por tiempo**: Eliminación de cachés antiguos

#### 2. Servicio de Caché (`/src/services/cacheService.ts`)
- **Comunicación con SW**: Coordina con el service worker para limpieza
- **Gestión de localStorage**: Limpia automáticamente datos obsoletos del navegador
- **Detección de actualizaciones**: Notifica cuando hay nuevas versiones
- **API sencilla**: Métodos para uso manual si es necesario

#### 3. Script de Build (`/scripts/updateServiceWorkerVersion.cjs`)
- **Versionado automático**: Actualiza la versión del SW durante el build
- **Sincronización**: Mantiene coherencia entre package.json y service worker

## 🚀 Cómo Funciona

### Durante el Build
```bash
npm run build
# 1. prebuild: Actualiza la versión en el service worker
# 2. build: Compila la aplicación
# 3. postbuild: Confirma que el versionado se completó
```

### Durante la Ejecución
1. **Inicialización**: El servicio se inicia automáticamente al cargar la app
2. **Limpieza periódica**: Cada hora verifica y limpia cachés obsoletos
3. **Detección de actualizaciones**: Compara versiones y limpia si es necesario
4. **Gestión de tamaño**: Mantiene el caché dentro de límites saludables

### Tipos de Limpieza

#### Caché del Service Worker
- Elimina versiones antiguas de archivos JS/CSS
- Mantiene solo los assets necesarios
- Limpia cachés de más de 7 días

#### Browser Storage
- localStorage: Limpia datos con timestamp antiguo
- sessionStorage: Remueve datos temporales obsoletos
- Keys configurables: Lista personalizable de keys a limpiar

## ⚙️ Configuración

### Personalizar el Servicio de Caché
```typescript
import { cacheService } from '@/services/cacheService';

// Actualizar configuración
cacheService.updateConfig({
  maxAge: 3 * 24 * 60 * 60 * 1000, // 3 días en lugar de 7
  storageKeys: [
    'mi-key-personalizada',
    'datos-temporales*', // Con wildcard
    'session-*'
  ]
});
```

### Uso Manual
```typescript
import { cacheService } from '@/services/cacheService';

// Forzar limpieza inmediata
await cacheService.forceCleanup();

// Verificar actualizaciones
await cacheService.checkForUpdates();

// Almacenar con timestamp automático
cacheService.setWithTimestamp('mi-key', { data: 'valor' });

// Obtener datos verificando timestamp
const data = cacheService.getWithTimestamp('mi-key');
```

## 🔧 Scripts NPM Disponibles

```bash
# Limpieza manual del caché (en desarrollo)
npm run cache:clean

# Build con versionado automático
npm run build

# Solo actualizar versión del service worker
node scripts/updateServiceWorkerVersion.cjs
```

## 📊 Logs y Monitoreo

El sistema genera logs detallados en la consola del navegador:

```
[SW] Cache cleanup completed
[CacheService] Initialized successfully
[CacheService] Browser storage cleanup completed
[CacheService] Current cache size: 15 MB
[SW] Deleted 5 old cache entries
```

## 🎯 Beneficios para el Usuario

### ✅ Lo que NO necesitas hacer más:
- ❌ Limpiar caché manualmente (Ctrl+F5, Ctrl+Shift+R)
- ❌ Borrar datos del navegador periódicamente
- ❌ Preocuparse por espacio de almacenamiento
- ❌ Problemas con versiones antiguas cached

### ✅ Lo que obtienes automáticamente:
- ✅ Rendimiento óptimo siempre
- ✅ Actualizaciones automáticas de la aplicación
- ✅ Gestión inteligente del almacenamiento
- ✅ Notificaciones de nuevas versiones
- ✅ Experiencia de usuario fluida

## 🔍 Troubleshooting

### Si experimentas problemas:

1. **Verificar que el service worker está activo**:
   ```javascript
   navigator.serviceWorker.getRegistrations()
     .then(registrations => console.log('SW registrations:', registrations));
   ```

2. **Forzar limpieza manual**:
   ```javascript
   cacheService.forceCleanup();
   ```

3. **Verificar logs en la consola**:
   - Abre DevTools (F12)
   - Ve a la pestaña Console
   - Busca mensajes con prefijo `[SW]` o `[CacheService]`

### En caso de problemas persistentes:
- Recargar la página una vez (F5)
- El sistema se auto-repara en la siguiente visita

## 🛡️ Seguridad y Privacidad

- **Solo limpia datos obsoletos**: No toca información importante del usuario
- **Configuración granular**: Control preciso sobre qué se limpia
- **Logs transparentes**: Toda la actividad es visible en la consola
- **Respeta permisos**: No accede a datos fuera del dominio de la aplicación

---

¡Con este sistema implementado, tus usuarios nunca más tendrán que limpiar el caché manualmente! 🎉