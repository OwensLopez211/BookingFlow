import React from 'react';
import { motion } from 'framer-motion';
import { notificationService } from '@/services/notificationService';

export const NotificationDemo: React.FC = () => {
  const showExampleNotifications = () => {
    setTimeout(() => {
      notificationService.success(
        'Demo de Notificaciones',
        'Esta es una notificación de éxito que desaparecerá automáticamente.'
      );
    }, 500);

    setTimeout(() => {
      notificationService.info(
        'Información importante',
        'Las notificaciones pueden tener diferentes tipos y prioridades.',
        { priority: 'medium' }
      );
    }, 1500);

    setTimeout(() => {
      notificationService.warning(
        'Advertencia del sistema',
        'Esta es una notificación de advertencia con mayor duración.',
        { duration: 6000 }
      );
    }, 2500);

    setTimeout(() => {
      notificationService.appointmentReminder({
        appointmentId: 'demo-123',
        clientName: 'Juan Pérez',
        serviceName: 'Corte de cabello',
      });
    }, 3500);

    setTimeout(() => {
      notificationService.error(
        'Error de demostración',
        'Esta es una notificación de error persistente con acciones.',
        {
          persistent: true,
          actions: [
            {
              label: 'Reintentar',
              action: () => {
                notificationService.success('Reintentado', 'Operación completada exitosamente.');
              },
              style: 'primary',
            },
            {
              label: 'Ignorar',
              action: () => {
                notificationService.info('Ignorado', 'Error ignorado por el usuario.');
              },
              style: 'secondary',
            },
          ],
        }
      );
    }, 4500);

    setTimeout(() => {
      notificationService.critical(
        'Alerta crítica de seguridad',
        'Intento de acceso sospechoso detectado desde una ubicación desconocida.',
        {
          metadata: { ip: '192.168.1.100', location: 'Ciudad desconocida' }
        }
      );
    }, 5500);
  };

  const showBulkNotification = () => {
    notificationService.bulkOperation('Importación de clientes', 100, 85);
  };

  const showAppointmentNotifications = () => {
    setTimeout(() => {
      notificationService.appointmentCreated({
        appointmentId: 'apt-001',
        clientName: 'María García',
        serviceName: 'Consulta médica',
      });
    }, 200);

    setTimeout(() => {
      notificationService.appointmentCancelled({
        appointmentId: 'apt-002',
        clientName: 'Carlos López',
        serviceName: 'Fisioterapia',
      });
    }, 1200);
  };

  const showPaymentNotifications = () => {
    setTimeout(() => {
      notificationService.paymentReceived({
        amount: 75.50,
        clientName: 'Ana Rodríguez',
      });
    }, 200);

    setTimeout(() => {
      notificationService.paymentFailed({
        amount: 120.00,
        clientName: 'Pedro Martínez',
        errorCode: 'CARD_DECLINED',
      });
    }, 1200);
  };

  const showSystemNotifications = () => {
    setTimeout(() => {
      notificationService.systemError(
        'Error de conexión a la base de datos',
        'No se pudo establecer conexión con el servidor principal.',
        'DB_CONNECTION_FAILED'
      );
    }, 200);

    setTimeout(() => {
      notificationService.resourceUnavailable({
        resourceName: 'Sala de reuniones A',
      });
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Demo del Sistema de Notificaciones</h2>
        <p className="text-gray-600">
          Prueba los diferentes tipos de notificaciones y ve cómo funcionan en tu aplicación.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificaciones Generales</h3>
          <div className="space-y-3">
            <button
              onClick={showExampleNotifications}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Mostrar Secuencia Completa
            </button>
            <button
              onClick={showBulkNotification}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              Operación Masiva
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificaciones de Citas</h3>
          <div className="space-y-3">
            <button
              onClick={showAppointmentNotifications}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Crear y Cancelar Citas
            </button>
            <button
              onClick={() => notificationService.appointmentReminder({
                appointmentId: 'demo-reminder',
                clientName: 'Elena Vargas',
                serviceName: 'Terapia psicológica',
              })}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Recordatorio de Cita
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificaciones de Pagos</h3>
          <div className="space-y-3">
            <button
              onClick={showPaymentNotifications}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Pagos Exitosos y Fallidos
            </button>
            <button
              onClick={() => notificationService.paymentReceived({
                amount: 250.00,
                clientName: 'Roberto Silva',
              })}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Pago Recibido
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificaciones del Sistema</h3>
          <div className="space-y-3">
            <button
              onClick={showSystemNotifications}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Errores del Sistema
            </button>
            <button
              onClick={() => notificationService.securityAlert(
                'Intento de acceso fallido',
                'Se detectaron 3 intentos de login fallidos consecutivos.',
                { userId: 'demo-user', userName: 'Usuario Demo' }
              )}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Alerta de Seguridad
            </button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Funcionalidades del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Sistema de colas inteligente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Categorización automática</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Prioridades dinámicas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Persistencia selectiva</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Limpieza automática de expiradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Centro de notificaciones</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              <span>Configuraciones personalizables</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Animaciones fluidas</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};