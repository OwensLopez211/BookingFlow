import React from 'react';
import { motion } from 'framer-motion';
import {
  BellIcon,
  CogIcon,
  CalendarIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  SpeakerWaveIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/stores/notificationStore';

export const NotificationSettings: React.FC = () => {
  const { settings, updateSettings } = useNotificationStore();

  const categoryIcons = {
    system: CogIcon,
    user: BellIcon,
    appointment: CalendarIcon,
    billing: CreditCardIcon,
    security: ShieldCheckIcon,
  };

  const categoryLabels = {
    system: 'Sistema',
    user: 'Usuario',
    appointment: 'Citas',
    billing: 'Facturación',
    security: 'Seguridad',
  };

  const priorityLabels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica',
  };

  const positionOptions = [
    { value: 'top-right', label: 'Arriba Derecha' },
    { value: 'top-left', label: 'Arriba Izquierda' },
    { value: 'bottom-right', label: 'Abajo Derecha' },
    { value: 'bottom-left', label: 'Abajo Izquierda' },
    { value: 'top-center', label: 'Arriba Centro' },
    { value: 'bottom-center', label: 'Abajo Centro' },
  ];

  const handleCategoryChange = (category: keyof typeof settings.categories, enabled: boolean) => {
    updateSettings({
      categories: {
        ...settings.categories,
        [category]: enabled,
      },
    });
  };

  const handlePriorityChange = (priority: keyof typeof settings.priority, enabled: boolean) => {
    updateSettings({
      priority: {
        ...settings.priority,
        [priority]: enabled,
      },
    });
  };

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración de Notificaciones</h2>
        <p className="text-gray-600">
          Personaliza cómo y cuándo recibes notificaciones en BookFlow.
        </p>
      </div>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BellIcon className="h-5 w-5" />
          Configuración General
        </h3>

        <div className="space-y-6">
          {/* Enable/Disable Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Activar Notificaciones</h4>
              <p className="text-sm text-gray-500">Habilitar o deshabilitar todas las notificaciones</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Position */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Posición de las Notificaciones</h4>
            <select
              value={settings.position}
              onChange={(e) => handleSettingChange('position', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!settings.enabled}
            >
              {positionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max Visible */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Máximo de Notificaciones Visibles</h4>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.maxVisible}
              onChange={(e) => handleSettingChange('maxVisible', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={!settings.enabled}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span className="font-medium">{settings.maxVisible}</span>
              <span>10</span>
            </div>
          </div>

          {/* Sounds */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SpeakerWaveIcon className="h-5 w-5 text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-900">Sonidos</h4>
                <p className="text-sm text-gray-500">Reproducir sonido al recibir notificaciones</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sounds}
                onChange={(e) => handleSettingChange('sounds', e.target.checked)}
                disabled={!settings.enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
            </label>
          </div>

          {/* Desktop Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ComputerDesktopIcon className="h-5 w-5 text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-900">Notificaciones del Sistema</h4>
                <p className="text-sm text-gray-500">Mostrar notificaciones del navegador</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.desktop}
                onChange={(e) => handleSettingChange('desktop', e.target.checked)}
                disabled={!settings.enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Category Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Categorías de Notificaciones</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(settings.categories).map(([category, enabled]) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons];
            const label = categoryLabels[category as keyof typeof categoryLabels];
            
            return (
              <div
                key={category}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  ${enabled 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50'
                  }
                  ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                `}
                onClick={() => settings.enabled && handleCategoryChange(category as keyof typeof settings.categories, !enabled)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      p-2 rounded-lg
                      ${enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className={`font-medium ${enabled ? 'text-blue-900' : 'text-gray-600'}`}>
                        {label}
                      </h4>
                    </div>
                  </div>
                  <div className={`
                    w-4 h-4 rounded-full border-2
                    ${enabled 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-gray-300'
                    }
                  `}>
                    {enabled && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Priority Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Prioridades de Notificaciones</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(settings.priority).map(([priority, enabled]) => {
            const label = priorityLabels[priority as keyof typeof priorityLabels];
            const colorClasses = {
              low: enabled ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-200 bg-gray-50 text-gray-600',
              medium: enabled ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-gray-200 bg-gray-50 text-gray-600',
              high: enabled ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-gray-200 bg-gray-50 text-gray-600',
              critical: enabled ? 'border-red-200 bg-red-50 text-red-800' : 'border-gray-200 bg-gray-50 text-gray-600',
            };
            
            return (
              <div
                key={priority}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center
                  ${colorClasses[priority as keyof typeof colorClasses]}
                  ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                `}
                onClick={() => settings.enabled && handlePriorityChange(priority as keyof typeof settings.priority, !enabled)}
              >
                <div className={`
                  w-3 h-3 rounded-full mx-auto mb-2
                  ${priority === 'low' ? 'bg-green-500' : 
                    priority === 'medium' ? 'bg-blue-500' :
                    priority === 'high' ? 'bg-amber-500' : 'bg-red-500'
                  }
                  ${enabled ? 'opacity-100' : 'opacity-30'}
                `}></div>
                <h4 className="font-medium text-sm">{label}</h4>
                <div className={`
                  w-4 h-4 rounded-full border-2 mx-auto mt-2
                  ${enabled 
                    ? 'bg-current border-current' 
                    : 'border-gray-300'
                  }
                `}>
                  {enabled && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};