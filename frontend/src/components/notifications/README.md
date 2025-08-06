# 🔔 Sistema de Notificaciones - Producción

## 📋 Resumen

Sistema de notificaciones en tiempo real completamente funcional para BookFlow, diseñado para owners de organizaciones.

## 🏗️ Arquitectura

### Componentes Principales

1. **`NotificationStore`** - Estado global con Zustand + persistencia
2. **`NotificationService`** - API de alto nivel para crear notificaciones
3. **`RealTimeNotificationService`** - Manejo de SSE/WebSocket
4. **`NotificationDropdown`** - UI en el NavigationBar
5. **`useRealTimeNotifications`** - Hook para conexión automática

## 🔐 Seguridad por Roles

**Solo usuarios con rol 'owner' pueden recibir notificaciones en tiempo real.**

- ✅ **Owner**: Conexión SSE activa, recibe todas las notificaciones
- ❌ **Admin/Staff**: Sin conexión, interface informativa

## 🌐 Configuración del Backend

### Endpoints Requeridos

```typescript
// SSE Stream para notificaciones
GET /v1/notifications/stream/:orgId
Authorization: Bearer <token>

// Envío de notificaciones
POST /v1/notifications/send
Content-Type: application/json
Authorization: Bearer <token>
{
  "type": "appointment_created",
  "data": {
    "appointmentId": "string",
    "clientName": "string",
    "serviceName": "string",
    "orgId": "string"
  },
  "timestamp": "ISO string"
}
```

### Implementación SSE en Backend

```javascript
// Ejemplo Express.js
app.get('/v1/notifications/stream/:orgId', authenticateToken, (req, res) => {
  const { orgId } = req.params;
  const { user } = req;
  
  // Verificar que el usuario es owner
  if (user.role !== 'owner' || user.orgId !== orgId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Mantener conexión activa
  const keepAlive = setInterval(() => {
    res.write('data: {"type":"heartbeat"}\\n\\n');
  }, 30000);
  
  // Almacenar conexión para envío de notificaciones
  addSSEConnection(orgId, res);
  
  req.on('close', () => {
    clearInterval(keepAlive);
    removeSSEConnection(orgId, res);
  });
});
```

## 📱 Uso en el Frontend

### Conexión Automática

```typescript
// Se conecta automáticamente en NavigationBar
const { isConnected } = useRealTimeNotifications();
```

### Enviar Notificaciones

```typescript
import { realTimeNotificationService } from '@/services/realTimeNotificationService';

// Desde BookingPage después de crear cita
realTimeNotificationService.notifyAppointmentCreated({
  appointmentId: result.id,
  clientName: 'Juan Pérez',
  serviceName: 'Consulta',
  date: '2024-01-15',
  time: '14:30',
  orgId: orgId
});
```

### Notificaciones Manuales

```typescript
import { notificationService } from '@/services/notificationService';

// Notificación de éxito
notificationService.success('Título', 'Mensaje', {
  category: 'appointment',
  priority: 'high',
  persistent: true
});

// Notificación crítica
notificationService.critical('Error Crítico', 'Descripción del error');
```

## 🎨 Interface de Usuario

### Indicadores Visuales

- **🟢 Verde**: Owner conectado en tiempo real
- **⚫ Gris**: Owner desconectado
- **🟡 Ámbar**: Usuario no-owner (con tooltip explicativo)

### Dropdown de Notificaciones

- **Badge rojo**: Contador de notificaciones sin leer
- **Tabs**: "Todas" / "Sin leer"
- **Acciones**: Marcar como leída, eliminar
- **Banner informativo**: Para usuarios no-owner

## 📊 Tipos de Notificaciones

| Tipo | Categoría | Prioridad | Persistente |
|------|-----------|-----------|-------------|
| Cita Creada | appointment | high | ✅ |
| Cita Cancelada | appointment | high | ✅ |
| Cita Actualizada | appointment | medium | ❌ |
| Pago Recibido | billing | medium | ❌ |
| Error Sistema | system | high | ✅ |
| Alerta Seguridad | security | critical | ✅ |

## 🔧 Configuración

### Variables de Entorno

```env
VITE_API_URL=https://api.bookflow.com
```

### Configuración de Notificaciones

```typescript
// En notificationStore.ts
const DEFAULT_SETTINGS = {
  enabled: true,
  categories: {
    system: true,
    appointment: true,
    billing: true,
    security: true,
    user: true
  },
  maxVisible: 5,
  sounds: true,
  desktop: false
};
```

## 🚀 Despliegue

### Checklist de Producción

- [ ] Backend implementa endpoints `/v1/notifications/*`
- [ ] SSE configurado con autenticación
- [ ] Variables de entorno configuradas
- [ ] Conexión HTTPS para SSE
- [ ] Manejo de reconexión automática
- [ ] Logs de error configurados

### Monitoreo

```typescript
// Verificar estado de conexión
const status = realTimeNotificationService.getConnectionStatus();
console.log('Connection Status:', status);
```

## 🔄 Fallback Mode

Si SSE falla, el sistema automáticamente usa eventos locales como fallback para desarrollo, pero en producción las notificaciones solo funcionarán con SSE real.

## 🎯 Beneficios

- ✅ **Tiempo real**: Notificaciones instantáneas sin polling
- ✅ **Eficiente**: Solo owners reciben notificaciones
- ✅ **Persistente**: Notificaciones importantes se guardan
- ✅ **Robusto**: Reconexión automática en caso de fallo
- ✅ **Escalable**: Arquitectura SSE preparada para múltiples organizaciones