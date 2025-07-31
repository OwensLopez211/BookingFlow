import React, { useState, useEffect } from 'react';
import { Card, Button, Input, LoadingSpinner, showToast } from '@/components/ui';
import { useOrganization } from '../../hooks/useOrganization';
import { BusinessHours, DaySchedule, NotificationSettings, AppointmentSystemSettings, BusinessInfo } from '../../../types/organization';
import { 
  CogIcon,
  ClockIcon,
  BellIcon,
  UserIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export const SettingsPage: React.FC = () => {
  const { organization, loadingState, error, updateSettings } = useOrganization();
  const [activeTab, setActiveTab] = useState<'general' | 'hours' | 'appointments' | 'notifications' | 'security' | 'appearance'>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for form editing
  const [formData, setFormData] = useState({
    businessHours: {} as BusinessHours,
    notifications: {} as NotificationSettings,
    appointmentSystem: {} as AppointmentSystemSettings,
    businessInfo: {} as BusinessInfo,
    timezone: 'America/Santiago',
    currency: 'CLP',
  });

  useEffect(() => {
    if (organization && organization.settings) {
      // Usar datos de businessConfiguration si appointmentSystem no existe
      const appointmentConfig = organization.settings.appointmentSystem || 
                               organization.settings.businessConfiguration || {
        appointmentModel: 'professional_based',
        allowClientSelection: true,
        bufferBetweenAppointments: 15,
        maxAdvanceBookingDays: 30
      };

      setFormData({
        businessHours: organization.settings.businessHours || {},
        notifications: organization.settings.notifications || {
          emailReminders: false,
          smsReminders: false,
          autoConfirmation: false,
          reminderHours: 24
        },
        appointmentSystem: appointmentConfig,
        businessInfo: organization.settings.businessInfo || {
          businessName: organization.name,
          businessAddress: organization.address || '',
          businessPhone: organization.phone || '',
          businessEmail: organization.email || ''
        },
        timezone: organization.settings.timezone || organization.currency ? 'America/Santiago' : 'America/Santiago',
        currency: organization.currency || organization.settings.currency || 'CLP',
      });
    }
  }, [organization]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    const success = await updateSettings({
      businessHours: formData.businessHours,
      notifications: formData.notifications,
      appointmentSystem: formData.appointmentSystem,
      businessInfo: formData.businessInfo,
      timezone: formData.timezone,
      currency: formData.currency,
    });

    if (success) {
      setIsEditing(false);
      showToast.success(
        '¡Configuración actualizada!',
        'Los cambios se han guardado exitosamente.'
      );
    } else {
      showToast.error(
        'Error al guardar',
        'No se pudieron guardar los cambios. Intenta de nuevo.'
      );
    }
    
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    if (organization && organization.settings) {
      setFormData({
        businessHours: organization.settings.businessHours || {},
        notifications: organization.settings.notifications || {},
        appointmentSystem: organization.settings.appointmentSystem || {
          appointmentModel: 'professional_based',
          allowClientSelection: true,
          bufferBetweenAppointments: 15,
          maxAdvanceBookingDays: 30
        },
        businessInfo: organization.settings.businessInfo || {
          businessName: organization.name,
          businessAddress: '',
          businessPhone: '',
          businessEmail: ''
        },
        timezone: organization.settings.timezone || 'America/Santiago',
        currency: organization.settings.currency || 'CLP',
      });
    }
    setIsEditing(false);
  };

  const updateBusinessHours = (day: keyof BusinessHours, schedule: DaySchedule) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: schedule,
      },
    }));
  };

  const updateNotifications = (key: keyof NotificationSettings, value: boolean | number) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const updateAppointmentSystem = (key: keyof AppointmentSystemSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      appointmentSystem: {
        ...prev.appointmentSystem,
        [key]: value,
      },
    }));
  };

  const updateBusinessInfo = (key: keyof BusinessInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        [key]: value,
      },
    }));
  };

  if (loadingState === 'loading' && !organization) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (loadingState === 'error' || !organization) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error: {error || 'No se pudo cargar la organización'}</p>
      </div>
    );
  }

  const getTemplateTypeName = (type: string) => {
    switch (type) {
      case 'beauty_salon':
        return 'Salón de Belleza';
      case 'hyperbaric_center':
        return 'Centro Hiperbárico';
      case 'medical_clinic':
        return 'Clínica Médica';
      case 'fitness_center':
        return 'Centro de Fitness';
      case 'consultant':
        return 'Consultoría';
      case 'custom':
        return 'Personalizado';
      default:
        return 'Otro';
    }
  };

  const days = [
    { key: 'monday' as keyof BusinessHours, name: 'Lunes' },
    { key: 'tuesday' as keyof BusinessHours, name: 'Martes' },
    { key: 'wednesday' as keyof BusinessHours, name: 'Miércoles' },
    { key: 'thursday' as keyof BusinessHours, name: 'Jueves' },
    { key: 'friday' as keyof BusinessHours, name: 'Viernes' },
    { key: 'saturday' as keyof BusinessHours, name: 'Sábado' },
    { key: 'sunday' as keyof BusinessHours, name: 'Domingo' },
  ];

  const tabs = [
    { id: 'general', name: 'General', icon: UserIcon },
    { id: 'hours', name: 'Horarios', icon: ClockIcon },
    { id: 'appointments', name: 'Citas', icon: CalendarIcon },
    { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
    { id: 'security', name: 'Seguridad', icon: ShieldCheckIcon },
    { id: 'appearance', name: 'Apariencia', icon: PaintBrushIcon },
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6 lg:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2 lg:mb-3">
                  Nombre de la Organización
                </label>
                <div className="relative">
                  <input
                    type="text" 
                    value={formData.businessInfo.businessName || organization.name}
                    onChange={(e) => updateBusinessInfo('businessName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2.5 lg:px-4 lg:py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium disabled:bg-gray-100 disabled:text-gray-600 transition-all duration-200 focus:border-blue-500 focus:ring-2 lg:focus:ring-4 focus:ring-blue-500/10 text-sm lg:text-base"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Nombre principal del negocio</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2 lg:mb-3">
                  Tipo de Negocio
                </label>
                <div className="relative">
                  <input
                    type="text" 
                    value={getTemplateTypeName(organization.templateType)}
                    disabled
                    className="w-full px-3 py-2.5 lg:px-4 lg:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 font-medium disabled:bg-gray-100 disabled:text-gray-600 transition-all duration-200 focus:border-blue-500 focus:ring-2 lg:focus:ring-4 focus:ring-blue-500/10 text-sm lg:text-base"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Definido durante el registro</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2 lg:mb-3">
                  Dirección del Negocio
                </label>
                <div className="relative">
                  <input
                    type="text" 
                    value={formData.businessInfo.businessAddress || ''}
                    onChange={(e) => updateBusinessInfo('businessAddress', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Ej: Av. Providencia 1234, Santiago"
                    className="w-full px-3 py-2.5 lg:px-4 lg:py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium disabled:bg-gray-100 disabled:text-gray-600 transition-all duration-200 focus:border-blue-500 focus:ring-2 lg:focus:ring-4 focus:ring-blue-500/10 text-sm lg:text-base"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Dirección física del establecimiento</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2 lg:mb-3">
                  Teléfono del Negocio
                </label>
                <div className="relative">
                  <input
                    type="tel" 
                    value={formData.businessInfo.businessPhone || ''}
                    onChange={(e) => updateBusinessInfo('businessPhone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Ej: +56 9 1234 5678"
                    className="w-full px-3 py-2.5 lg:px-4 lg:py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium disabled:bg-gray-100 disabled:text-gray-600 transition-all duration-200 focus:border-blue-500 focus:ring-2 lg:focus:ring-4 focus:ring-blue-500/10 text-sm lg:text-base"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Número de contacto principal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2 lg:mb-3">
                  Email del Negocio
                </label>
                <div className="relative">
                  <input
                    type="email" 
                    value={formData.businessInfo.businessEmail || ''}
                    onChange={(e) => updateBusinessInfo('businessEmail', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Ej: contacto@minegocios.com"
                    className="w-full px-3 py-2.5 lg:px-4 lg:py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium disabled:bg-gray-100 disabled:text-gray-600 transition-all duration-200 focus:border-blue-500 focus:ring-2 lg:focus:ring-4 focus:ring-blue-500/10 text-sm lg:text-base"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email de contacto comercial</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2 lg:mb-3">
                  Moneda
                </label>
                <div className="relative">
                  <select 
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2.5 lg:px-4 lg:py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 lg:focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed text-sm lg:text-base"
                  >
                    <option value="CLP">🇨🇱 Peso Chileno (CLP)</option>
                    <option value="USD">🇺🇸 Dólar Estadounidense (USD)</option>
                    <option value="EUR">🇪🇺 Euro (EUR)</option>
                    <option value="ARS">🇦🇷 Peso Argentino (ARS)</option>
                    <option value="PEN">🇵🇪 Sol Peruano (PEN)</option>
                    <option value="COP">🇨🇴 Peso Colombiano (COP)</option>
                    <option value="MXN">🇲🇽 Peso Mexicano (MXN)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Moneda para precios y facturación</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2 lg:mb-3">
                  Zona Horaria
                </label>
                <div className="relative">
                  <select 
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2.5 lg:px-4 lg:py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 lg:focus:ring-4 focus:ring-blue-500/10 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed text-sm lg:text-base"
                  >
                    <option value="America/Santiago">🇨🇱 Santiago (GMT-3)</option>
                    <option value="America/Buenos_Aires">🇦🇷 Buenos Aires (GMT-3)</option>
                    <option value="America/Mexico_City">🇲🇽 Ciudad de México (GMT-6)</option>
                    <option value="America/Lima">🇵🇪 Lima (GMT-5)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Configuración regional y horarios</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2 lg:mb-3">
                  Idioma de la Interfaz
                </label>
                <div className="relative">
                  <select 
                    disabled
                    className="w-full px-3 py-2.5 lg:px-4 lg:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 font-medium disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed appearance-none text-sm lg:text-base"
                  >
                    <option>🇪🇸 Español</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Más idiomas próximamente</p>
              </div>
            </div>
          </div>
        );

      case 'hours':
        return (
          <div className="space-y-3">
            {days.map(({ key, name }) => (
              <div key={key} className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200">
                {/* Mobile: Layout en columna */}
                <div className="lg:flex lg:items-center lg:justify-between">
                  <div className="flex items-center justify-between mb-3 lg:mb-0 lg:w-auto">
                    <div className="flex items-center space-x-3">
                      <div className="w-20 lg:w-24 text-sm font-semibold text-gray-800">{name}</div>
                      
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={formData.businessHours[key]?.isOpen || false}
                            onChange={(e) => updateBusinessHours(key, {
                              ...formData.businessHours[key],
                              isOpen: e.target.checked,
                              openTime: formData.businessHours[key]?.openTime || '09:00',
                              closeTime: formData.businessHours[key]?.closeTime || '18:00',
                            })}
                            disabled={!isEditing}
                            className="sr-only"
                          />
                          <div className={`w-10 h-5 lg:w-11 lg:h-6 rounded-full transition-colors duration-200 ${
                            formData.businessHours[key]?.isOpen 
                              ? 'bg-blue-600' 
                              : 'bg-gray-300'
                          } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className={`w-4 h-4 lg:w-5 lg:h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                              formData.businessHours[key]?.isOpen ? 'translate-x-5 lg:translate-x-5' : 'translate-x-0.5'
                            } mt-0.5`}></div>
                          </div>
                        </div>
                        <span className={`text-xs lg:text-sm font-medium ${
                          formData.businessHours[key]?.isOpen ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {formData.businessHours[key]?.isOpen ? 'Abierto' : 'Cerrado'}
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  {formData.businessHours[key]?.isOpen && (
                    <div className="flex items-center justify-center space-x-2 lg:space-x-3">
                      <div className="flex items-center space-x-1">
                        <label className="text-xs font-medium text-gray-600">De</label>
                        <input
                          type="time"
                          value={formData.businessHours[key]?.openTime || '09:00'}
                          onChange={(e) => updateBusinessHours(key, {
                            ...formData.businessHours[key],
                            isOpen: formData.businessHours[key]?.isOpen || true,
                            openTime: e.target.value,
                            closeTime: formData.businessHours[key]?.closeTime || '18:00',
                          })}
                          disabled={!isEditing}
                          className="px-2 py-1.5 lg:px-3 lg:py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 font-medium text-xs lg:text-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-gray-100 disabled:text-gray-600 w-20"
                        />
                      </div>
                      
                      <div className="text-xs lg:text-sm text-gray-400 font-medium">a</div>
                      
                      <div className="flex items-center space-x-1">
                        <label className="text-xs font-medium text-gray-600">a</label>
                        <input
                          type="time"
                          value={formData.businessHours[key]?.closeTime || '18:00'}
                          onChange={(e) => updateBusinessHours(key, {
                            ...formData.businessHours[key],
                            isOpen: formData.businessHours[key]?.isOpen || true,
                            openTime: formData.businessHours[key]?.openTime || '09:00',
                            closeTime: e.target.value,
                          })}
                          disabled={!isEditing}
                          className="px-2 py-1.5 lg:px-3 lg:py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 font-medium text-xs lg:text-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-gray-100 disabled:text-gray-600 w-20"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {!formData.businessHours[key]?.isOpen && (
                  <div className="mt-3 text-xs text-gray-500 text-center lg:text-left">
                    El negocio permanece cerrado este día
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'appointments':
        return (
          <div className="space-y-6">
            {/* Sistema de Citas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Sistema de Citas</h3>
              
              <div className="space-y-3">
                {[
                  {
                    value: 'professional_based',
                    title: 'Basado en Profesionales',
                    description: 'Los clientes reservan citas con profesionales específicos',
                    icon: '👨‍⚕️',
                  },
                  {
                    value: 'resource_based',
                    title: 'Basado en Recursos',
                    description: 'Los clientes reservan equipos, salas o instalaciones',
                    icon: '🏢',
                  },
                  {
                    value: 'hybrid',
                    title: 'Híbrido',
                    description: 'Combina profesionales y recursos para máxima flexibilidad',
                    icon: '⚡',
                  }
                ].map((model) => {
                  const isSelected = formData.appointmentSystem.appointmentModel === model.value;
                  
                  return (
                    <label
                      key={model.value}
                      className={`
                        relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="appointmentModel"
                        value={model.value}
                        checked={isSelected}
                        onChange={(e) => updateAppointmentSystem('appointmentModel', e.target.value)}
                        disabled={!isEditing}
                        className="sr-only"
                      />
                      
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="text-2xl">{model.icon}</div>
                        <div className="flex-1">
                          <h4 className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                            {model.title}
                          </h4>
                          <p className={`text-xs mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                            {model.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`
                        w-4 h-4 rounded-full border-2 flex items-center justify-center
                        ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                      `}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Configuraciones Adicionales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Configuraciones Adicionales</h3>
              
              <div className="space-y-4">
                {/* Selección de Cliente */}
                <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                  <label className="flex items-start cursor-pointer">
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-800 block">
                        Permitir selección específica
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        Los clientes pueden elegir profesional o recurso específico al hacer la reserva
                      </p>
                    </div>
                    <div className="relative ml-4">
                      <input 
                        type="checkbox" 
                        checked={formData.appointmentSystem.allowClientSelection}
                        onChange={(e) => updateAppointmentSystem('allowClientSelection', e.target.checked)}
                        disabled={!isEditing}
                        className="sr-only"
                      />
                      <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                        formData.appointmentSystem.allowClientSelection ? 'bg-blue-600' : 'bg-gray-300'
                      } ${!isEditing ? 'opacity-50' : ''}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          formData.appointmentSystem.allowClientSelection ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`}></div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Buffer y Anticipación */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Buffer entre citas
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      Tiempo libre automático entre citas consecutivas
                    </p>
                    <select
                      value={formData.appointmentSystem.bufferBetweenAppointments}
                      onChange={(e) => updateAppointmentSystem('bufferBetweenAppointments', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                    >
                      <option value={0}>Sin buffer</option>
                      <option value={5}>5 minutos</option>
                      <option value={10}>10 minutos</option>
                      <option value={15}>15 minutos</option>
                      <option value={20}>20 minutos</option>
                      <option value={30}>30 minutos</option>
                    </select>
                  </div>

                  <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Anticipación máxima
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      Cuánto tiempo en el futuro pueden reservar los clientes
                    </p>
                    <select
                      value={formData.appointmentSystem.maxAdvanceBookingDays}
                      onChange={(e) => updateAppointmentSystem('maxAdvanceBookingDays', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                    >
                      <option value={7}>1 semana</option>
                      <option value={14}>2 semanas</option>
                      <option value={30}>1 mes</option>
                      <option value={60}>2 meses</option>
                      <option value={90}>3 meses</option>
                      <option value={180}>6 meses</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4 lg:space-y-6">
            <div className="space-y-3 lg:space-y-4">
              <div className="p-4 lg:p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200">
                <label className="flex items-start cursor-pointer group">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3 mb-2 lg:mb-0">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800 block">Recordatorios por Email</span>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">Enviar recordatorios automáticos a los clientes antes de las citas</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative ml-3 lg:ml-4 flex-shrink-0">
                    <input 
                      type="checkbox" 
                      checked={formData.notifications.emailReminders || false}
                      onChange={(e) => updateNotifications('emailReminders', e.target.checked)}
                      disabled={!isEditing}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 lg:w-11 lg:h-6 rounded-full transition-colors duration-200 ${
                      formData.notifications.emailReminders 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300'
                    } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className={`w-4 h-4 lg:w-5 lg:h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        formData.notifications.emailReminders ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="p-4 lg:p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200">
                <label className="flex items-start cursor-pointer group">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3 mb-2 lg:mb-0">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800 block">Confirmaciones Automáticas</span>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">Confirmar automáticamente las citas al momento de crearlas</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative ml-3 lg:ml-4 flex-shrink-0">
                    <input 
                      type="checkbox" 
                      checked={formData.notifications.autoConfirmation || false}
                      onChange={(e) => updateNotifications('autoConfirmation', e.target.checked)}
                      disabled={!isEditing}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 lg:w-11 lg:h-6 rounded-full transition-colors duration-200 ${
                      formData.notifications.autoConfirmation 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300'
                    } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className={`w-4 h-4 lg:w-5 lg:h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        formData.notifications.autoConfirmation ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="p-4 lg:p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200">
                <label className="flex items-start cursor-pointer group">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3 mb-2 lg:mb-0">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800 block">Recordatorios por SMS</span>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">Enviar recordatorios por mensaje de texto al teléfono del cliente</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative ml-3 lg:ml-4 flex-shrink-0">
                    <input 
                      type="checkbox" 
                      checked={formData.notifications.smsReminders || false}
                      onChange={(e) => updateNotifications('smsReminders', e.target.checked)}
                      disabled={!isEditing}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 lg:w-11 lg:h-6 rounded-full transition-colors duration-200 ${
                      formData.notifications.smsReminders 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300'
                    } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className={`w-4 h-4 lg:w-5 lg:h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        formData.notifications.smsReminders ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="p-4 lg:p-5 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-semibold text-gray-800 mb-2 lg:mb-3">Tiempo de Anticipación</label>
                  <p className="text-xs text-gray-600 mb-3 lg:mb-4 leading-relaxed">¿Con cuánta anticipación se deben enviar los recordatorios?</p>
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <input
                      type="number"
                      min="1"
                      max="72"
                      value={formData.notifications.reminderHours || 24}
                      onChange={(e) => updateNotifications('reminderHours', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="w-20 lg:w-24 px-2 py-1.5 lg:px-3 lg:py-2 bg-white border-2 border-orange-200 rounded-lg text-gray-800 font-medium text-sm transition-all duration-200 hover:border-orange-300 focus:border-orange-500 focus:ring-2 lg:focus:ring-4 focus:ring-orange-500/10 disabled:bg-gray-100 disabled:text-gray-600"
                    />
                    <span className="text-xs lg:text-sm font-medium text-gray-700 leading-relaxed">horas antes de la cita</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheckIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Configuración de Seguridad</h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                Las opciones de seguridad avanzadas como autenticación de dos factores y gestión de sesiones estarán disponibles próximamente.
              </p>
              <div className="mt-6 inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>En desarrollo</span>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <PaintBrushIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Personalización de Tema</h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
                Próximamente podrás personalizar los colores, temas y el diseño de la interfaz para adaptarla a tu marca.
              </p>
              <div className="mt-6 inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                <span>Próximamente</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full flex-col space-y-6">
        {/* Desktop Header */}
        <div className="flex-shrink-0 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl opacity-90"></div>
          <div className="absolute inset-0 bg-white/5 rounded-2xl"></div>
          
          <div className="relative p-6 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <CogIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Configuración</h1>
                  <p className="text-blue-100">Administra la configuración de tu organización</p>
                </div>
              </div>
              
              {isEditing && (
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 border border-white/20 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 border border-white/20 disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              )}
              
              {!isEditing && (activeTab === 'general' || activeTab === 'hours' || activeTab === 'appointments' || activeTab === 'notifications') && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 border border-white/20"
                >
                  Editar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Tabs and Content */}
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Tab Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-6 h-full overflow-y-auto">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden h-full flex flex-col pb-20">
        {/* Mobile Header */}
        <div className="flex-shrink-0 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl opacity-95"></div>
          <div className="relative p-4 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <CogIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Configuración</h1>
                  <p className="text-xs text-blue-100">Administra tu organización</p>
                </div>
              </div>
              
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/20 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/20 disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              )}
              
              {!isEditing && (activeTab === 'general' || activeTab === 'hours' || activeTab === 'appointments' || activeTab === 'notifications') && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/20"
                >
                  Editar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation - Grid Layout sin scroll */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 p-2">
          <div className="grid grid-cols-5 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-all duration-200 relative rounded-lg ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="leading-tight text-center">{tab.name}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Content Area */}
        <div className="flex-1 p-4 min-h-0 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-4 min-h-full">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </>
  );
};