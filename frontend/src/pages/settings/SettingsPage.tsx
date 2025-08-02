import React, { useState, useEffect } from 'react';
import { Card, Button, Input, LoadingSpinner, showToast } from '@/components/ui';
import { useOrganization } from '../../hooks/useOrganization';
import { BusinessHours, DaySchedule, NotificationSettings, AppointmentSystemSettings, BusinessInfo, Service, Professional } from '../../../types/organization';
import { 
  CogIcon,
  ClockIcon,
  BellIcon,
  UserIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  CalendarIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  ClockIcon as ClockOutlineIcon
} from '@heroicons/react/24/outline';

export const SettingsPage: React.FC = () => {
  const { organization, loadingState, error, updateSettings } = useOrganization();
  
  // Helper function to get plan limits
  const getPlanLimits = () => {
    const currentPlan = organization?.subscription?.plan;
    switch (currentPlan) {
      case 'free':
        return { maxResources: 1, maxProfessionals: 1, planName: 'gratuito' };
      case 'basic':
        return { maxResources: 5, maxProfessionals: 5, planName: 'básico' };
      case 'premium':
        return { maxResources: 10, maxProfessionals: 10, planName: 'premium' };
      default:
        return { maxResources: 1, maxProfessionals: 1, planName: 'gratuito' };
    }
  };
  const [activeTab, setActiveTab] = useState<'general' | 'hours' | 'appointments' | 'services' | 'notifications' | 'security' | 'appearance'>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [professionalScheduleModal, setProfessionalScheduleModal] = useState<{isOpen: boolean, professionalIndex: number | null}>({isOpen: false, professionalIndex: null});
  const [professionalScheduleForm, setProfessionalScheduleForm] = useState<{
    useCustomSchedule: boolean;
    schedule: BusinessHours;
  }>({useCustomSchedule: false, schedule: {}});
  
  // Local state for form editing
  const [formData, setFormData] = useState({
    // Organization root-level fields
    name: '',
    address: '',
    phone: '',
    email: '',
    // Settings
    businessHours: {} as BusinessHours,
    notifications: {} as NotificationSettings,
    appointmentSystem: {} as AppointmentSystemSettings,
    businessInfo: {} as BusinessInfo,
    services: [] as Service[],
    timezone: 'America/Santiago',
    currency: 'CLP',
  });

  useEffect(() => {
    console.log('📄 SettingsPage useEffect triggered');
    console.log('📊 Current organization:', organization);
    
    if (organization && organization.settings) {
      console.log('✅ Organization and settings exist, updating formData');
      
      // Usar datos de businessConfiguration si appointmentSystem no existe
      const planLimits = (() => {
        const currentPlan = organization?.subscription?.plan;
        switch (currentPlan) {
          case 'free': return { maxResources: 1, maxProfessionals: 1 };
          case 'basic': return { maxResources: 5, maxProfessionals: 5 };
          case 'premium': return { maxResources: 10, maxProfessionals: 10 };
          default: return { maxResources: 1, maxProfessionals: 1 };
        }
      })();

      const appointmentConfig = organization.settings.appointmentSystem || 
                               organization.settings.businessConfiguration || {
        appointmentModel: 'professional_based',
        allowClientSelection: true,
        bufferBetweenAppointments: 15,
        maxAdvanceBookingDays: 30,
        maxProfessionals: planLimits.maxProfessionals,
        maxResources: planLimits.maxResources,
        professionals: []
      };

      const newFormData = {
        // Organization root-level fields
        name: organization.name,
        address: organization.address || '',
        phone: organization.phone || '',
        email: organization.email || '',
        // Settings
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
        services: organization.settings.services || [],
        timezone: organization.settings.timezone || 'America/Santiago',
        currency: organization.currency || organization.settings.currency || 'CLP',
      };
      
      console.log('📝 New formData to set:', newFormData);
      setFormData(newFormData);
      console.log('✅ FormData updated successfully');
    } else {
      console.log('❌ Organization or settings not available yet');
    }
  }, [organization]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    const dataToSend = {
      // Datos básicos de la organización (usar desde root del formData si existen, sino desde businessInfo)
      name: formData.name || formData.businessInfo.businessName,
      address: formData.address || formData.businessInfo.businessAddress,
      phone: formData.phone || formData.businessInfo.businessPhone,
      email: formData.email || formData.businessInfo.businessEmail,
      currency: formData.currency,
      // Settings
      timezone: formData.timezone,
      businessHours: formData.businessHours,
      notifications: formData.notifications,
      appointmentSystem: formData.appointmentSystem,
      businessInfo: formData.businessInfo,
      services: formData.services,
    };
    
    console.log('🚀 SettingsPage: Datos a enviar al updateSettings:', JSON.stringify(dataToSend, null, 2));
    
    const success = await updateSettings(dataToSend);

    if (success) {
      console.log('✅ Success: Saliendo del modo edición');
      setIsEditing(false);
      showToast.success(
        '¡Configuración actualizada!',
        'Los cambios se han guardado exitosamente.'
      );
    } else {
      console.log('❌ Error: Manteniéndose en modo edición');
      showToast.error(
        'Error al guardar',
        'No se pudieron guardar los cambios. Intenta de nuevo.'
      );
    }
    
    setIsSaving(false);
    console.log('📊 Final state - isEditing:', false, 'isSaving:', false);
  };

  const handleCancelEdit = () => {
    if (organization && organization.settings) {
      // Get plan limits for default values
      const planLimits = (() => {
        const currentPlan = organization?.subscription?.plan;
        switch (currentPlan) {
          case 'free': return { maxResources: 1, maxProfessionals: 1 };
          case 'basic': return { maxResources: 5, maxProfessionals: 5 };
          case 'premium': return { maxResources: 10, maxProfessionals: 10 };
          default: return { maxResources: 1, maxProfessionals: 1 };
        }
      })();

      const appointmentConfig = organization.settings.appointmentSystem || 
                               organization.settings.businessConfiguration || {
        appointmentModel: 'professional_based',
        allowClientSelection: true,
        bufferBetweenAppointments: 15,
        maxAdvanceBookingDays: 30,
        maxProfessionals: planLimits.maxProfessionals,
        maxResources: planLimits.maxResources,
        professionals: []
      };

      setFormData({
        // Organization root-level fields
        name: organization.name,
        address: organization.address || '',
        phone: organization.phone || '',
        email: organization.email || '',
        // Settings
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
        services: organization.settings.services || [],
        timezone: organization.settings.timezone || 'America/Santiago',
        currency: organization.currency || organization.settings.currency || 'CLP',
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
    // Validar límites del plan
    if (key === 'maxProfessionals' || key === 'maxResources') {
      const numValue = parseInt(value) || 1;
      const planLimits = getPlanLimits();
      const maxAllowed = key === 'maxProfessionals' ? planLimits.maxProfessionals : planLimits.maxResources;
      
      if (numValue > maxAllowed) {
        const resourceType = key === 'maxProfessionals' ? 'profesionales' : 'recursos';
        showToast.error(
          `Límite del plan ${planLimits.planName}`,
          `El plan ${planLimits.planName} permite máximo ${maxAllowed} ${resourceType}. Actualiza tu plan para tener más.`
        );
        return;
      }
    }

    setFormData(prev => {
      const newAppointmentSystem = {
        ...prev.appointmentSystem,
        [key]: value,
      };

      // Si se está cambiando maxProfessionals, ajustar la lista de profesionales
      if (key === 'maxProfessionals') {
        const newMaxProfessionals = parseInt(value) || 1;
        const currentProfessionals = prev.appointmentSystem.professionals || [];
        
        if (newMaxProfessionals > currentProfessionals.length) {
          // Agregar profesionales vacíos hasta alcanzar el máximo
          const professionalsToAdd = newMaxProfessionals - currentProfessionals.length;
          const newProfessionals = [...currentProfessionals];
          
          for (let i = 0; i < professionalsToAdd; i++) {
            newProfessionals.push({
              id: `professional_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
              name: '',
              photo: '',
              isActive: true
            });
          }
          
          newAppointmentSystem.professionals = newProfessionals;
        } else if (newMaxProfessionals < currentProfessionals.length) {
          // Mantener solo los primeros N profesionales
          newAppointmentSystem.professionals = currentProfessionals.slice(0, newMaxProfessionals);
        }
      }

      return {
        ...prev,
        appointmentSystem: newAppointmentSystem,
      };
    });
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

  // Función para sincronizar cambios en campos que afectan tanto organización como businessInfo
  const updateSyncedField = (orgField: string, businessInfoField: keyof BusinessInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      // Actualizar businessInfo
      businessInfo: {
        ...prev.businessInfo,
        [businessInfoField]: value,
      },
      // También mantener un registro del cambio para la organización
      [orgField]: value,
    }));
  };

  const updateService = (index: number, key: keyof Service, value: any) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, [key]: value } : service
      ),
    }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, {
        name: '',
        description: '',
        duration: 60,
        price: 0,
        isActive: true
      }],
    }));
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const addProfessional = () => {
    const planLimits = getPlanLimits();
    const maxAllowed = planLimits.maxProfessionals;
    const currentCount = formData.appointmentSystem.professionals?.length || 0;
    
    if (currentCount >= maxAllowed) {
      showToast.error(
        'Límite alcanzado',
        `El plan ${planLimits.planName} permite máximo ${maxAllowed} profesionales.`
      );
      return;
    }

    setFormData(prev => ({
      ...prev,
      appointmentSystem: {
        ...prev.appointmentSystem,
        professionals: [...(prev.appointmentSystem.professionals || []), {
          id: `professional_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: '',
          photo: '',
          isActive: true
        }],
      },
    }));
  };

  const updateProfessional = (index: number, key: keyof Professional, value: any) => {
    setFormData(prev => ({
      ...prev,
      appointmentSystem: {
        ...prev.appointmentSystem,
        professionals: prev.appointmentSystem.professionals?.map((professional, i) => 
          i === index ? { ...professional, [key]: value } : professional
        ) || [],
      },
    }));
  };

  const removeProfessional = (index: number) => {
    setFormData(prev => ({
      ...prev,
      appointmentSystem: {
        ...prev.appointmentSystem,
        professionals: prev.appointmentSystem.professionals?.filter((_, i) => i !== index) || [],
      },
    }));
  };

  const handlePhotoUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño del archivo (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast.error('Archivo muy grande', 'La foto debe ser menor a 2MB');
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showToast.error('Tipo de archivo inválido', 'Solo se permiten imágenes');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      updateProfessional(index, 'photo', base64);
    };
    reader.readAsDataURL(file);
  };

  const openScheduleModal = (professionalIndex: number) => {
    const professional = formData.appointmentSystem.professionals?.[professionalIndex];
    const hasCustomSchedule = professional?.schedule && Object.keys(professional.schedule).length > 0;
    
    setProfessionalScheduleForm({
      useCustomSchedule: hasCustomSchedule || false,
      schedule: hasCustomSchedule ? professional.schedule : formData.businessHours
    });
    
    setProfessionalScheduleModal({isOpen: true, professionalIndex});
  };

  const closeScheduleModal = () => {
    setProfessionalScheduleModal({isOpen: false, professionalIndex: null});
  };

  const updateProfessionalSchedule = () => {
    if (professionalScheduleModal.professionalIndex !== null) {
      const scheduleToSave = professionalScheduleForm.useCustomSchedule 
        ? professionalScheduleForm.schedule 
        : null; // null significa usar horarios del negocio
        
      updateProfessional(professionalScheduleModal.professionalIndex, 'schedule', scheduleToSave);
      closeScheduleModal();
    }
  };

  const updateProfessionalScheduleDay = (day: keyof BusinessHours, schedule: DaySchedule) => {
    setProfessionalScheduleForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: schedule,
      },
    }));
  };

  const toggleCustomSchedule = (useCustom: boolean) => {
    setProfessionalScheduleForm(prev => ({
      ...prev,
      useCustomSchedule: useCustom,
      schedule: useCustom ? (prev.schedule || formData.businessHours) : formData.businessHours
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
    { id: 'services', name: 'Servicios', icon: CogIcon },
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
                    onChange={(e) => updateSyncedField('name', 'businessName', e.target.value)}
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
                    onChange={(e) => updateSyncedField('address', 'businessAddress', e.target.value)}
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
                    onChange={(e) => updateSyncedField('phone', 'businessPhone', e.target.value)}
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
                    onChange={(e) => updateSyncedField('email', 'businessEmail', e.target.value)}
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
            {/* Plan Current Info */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">
                    Plan Actual: {getPlanLimits().planName.charAt(0).toUpperCase() + getPlanLimits().planName.slice(1)}
                  </h4>
                  <p className="text-xs text-blue-700">
                    Límites: {getPlanLimits().maxProfessionals} profesionales • {getPlanLimits().maxResources} recursos • {organization?.subscription?.limits?.maxAppointmentsPerMonth || 100} citas/mes
                  </p>
                </div>
                {organization?.subscription?.plan === 'free' && (
                  <div className="text-right">
                    <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors">
                      Actualizar Plan
                    </button>
                  </div>
                )}
              </div>
            </div>

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

            {/* Configuración de Capacidad */}
            {(formData.appointmentSystem.appointmentModel === 'professional_based' || 
              formData.appointmentSystem.appointmentModel === 'resource_based') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Configuración de Capacidad</h3>
                
                <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                  <div className="space-y-4">
                    {formData.appointmentSystem.appointmentModel === 'professional_based' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Cantidad de Profesionales
                        </label>
                        <p className="text-xs text-gray-600 mb-3">
                          Número máximo de profesionales que trabajarán en tu negocio
                        </p>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="1"
                            max={getPlanLimits().maxProfessionals}
                            value={formData.appointmentSystem.maxProfessionals || 1}
                            onChange={(e) => updateAppointmentSystem('maxProfessionals', parseInt(e.target.value) || 1)}
                            disabled={!isEditing}
                            className="w-20 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                          />
                          <span className="text-sm text-gray-600">profesionales</span>
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            Plan {getPlanLimits().planName}: máx. {getPlanLimits().maxProfessionals}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Lista de Profesionales */}
                    {formData.appointmentSystem.appointmentModel === 'professional_based' && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800">Profesionales</h4>
                            <p className="text-xs text-gray-600">Agrega los profesionales que trabajarán en tu negocio</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs text-gray-500">
                                {formData.appointmentSystem.professionals?.length || 0} de {getPlanLimits().maxProfessionals} utilizados
                              </span>
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    (formData.appointmentSystem.professionals?.length || 0) >= getPlanLimits().maxProfessionals 
                                      ? 'bg-red-500' 
                                      : (formData.appointmentSystem.professionals?.length || 0) > getPlanLimits().maxProfessionals * 0.8
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                  }`}
                                  style={{ 
                                    width: `${Math.min(100, ((formData.appointmentSystem.professionals?.length || 0) / getPlanLimits().maxProfessionals) * 100)}%` 
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          {isEditing && (
                            <div className="text-right">
                              {(formData.appointmentSystem.professionals?.length || 0) >= getPlanLimits().maxProfessionals ? (
                                <div className="text-xs text-red-600 mb-2">
                                  Límite alcanzado
                                </div>
                              ) : null}
                              <button
                                onClick={addProfessional}
                                disabled={(formData.appointmentSystem.professionals?.length || 0) >= getPlanLimits().maxProfessionals}
                                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                              >
                                <PlusIcon className="h-4 w-4" />
                                <span>Agregar</span>
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {(!formData.appointmentSystem.professionals || formData.appointmentSystem.professionals.length === 0) ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <UserCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No hay profesionales agregados</p>
                            {isEditing && (
                              <button
                                onClick={addProfessional}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Agregar el primer profesional
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {formData.appointmentSystem.professionals?.map((professional, index) => (
                              <div key={professional.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-start space-x-4">
                                  {/* Foto del profesional */}
                                  <div className="relative">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                                      {professional.photo ? (
                                        <img 
                                          src={professional.photo} 
                                          alt={professional.name} 
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <UserCircleIcon className="h-10 w-10 text-gray-400" />
                                      )}
                                    </div>
                                    
                                    {isEditing && (
                                      <label className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full cursor-pointer transition-colors">
                                        <PhotoIcon className="h-3 w-3" />
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handlePhotoUpload(index, e)}
                                          className="hidden"
                                        />
                                      </label>
                                    )}
                                  </div>
                                  
                                  {/* Información del profesional */}
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 space-y-2">
                                        <input
                                          type="text"
                                          value={professional.name}
                                          onChange={(e) => updateProfessional(index, 'name', e.target.value)}
                                          disabled={!isEditing}
                                          placeholder="Nombre del profesional"
                                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-600 font-medium"
                                        />
                                        
                                        <div className="flex items-center justify-between">
                                          <label className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              checked={professional.isActive}
                                              onChange={(e) => updateProfessional(index, 'isActive', e.target.checked)}
                                              disabled={!isEditing}
                                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-600">Activo</span>
                                          </label>
                                          
                                          {isEditing && (
                                            <button
                                              onClick={() => openScheduleModal(index)}
                                              className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                                            >
                                              <ClockOutlineIcon className="h-3 w-3" />
                                              <span>Horarios</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {isEditing && (
                                        <button
                                          onClick={() => removeProfessional(index)}
                                          className="text-red-600 hover:text-red-800 p-1 ml-2"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {formData.appointmentSystem.appointmentModel === 'resource_based' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Cantidad de Salas/Equipos
                        </label>
                        <p className="text-xs text-gray-600 mb-3">
                          Número máximo de salas, equipos o instalaciones disponibles
                        </p>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="1"
                            max={getPlanLimits().maxResources}
                            value={formData.appointmentSystem.maxResources || 1}
                            onChange={(e) => updateAppointmentSystem('maxResources', parseInt(e.target.value) || 1)}
                            disabled={!isEditing}
                            className="w-20 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                          />
                          <span className="text-sm text-gray-600">recursos</span>
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            Plan {getPlanLimits().planName}: máx. {getPlanLimits().maxResources}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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

      case 'services':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Servicios Configurados</h3>
                {isEditing && (
                  <button
                    onClick={addService}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    + Agregar Servicio
                  </button>
                )}
              </div>

              {formData.services.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CogIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">No hay servicios configurados</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Los servicios configurados en el onboarding aparecerán aquí
                  </p>
                  {isEditing && (
                    <button
                      onClick={addService}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Agregar Primer Servicio
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.services.map((service, index) => (
                    <div key={index} className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">#{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {service.name || 'Nuevo Servicio'}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {service.duration} min • ${service.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {isEditing && (
                          <div className="flex items-center space-x-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={service.isActive !== false}
                                onChange={(e) => updateService(index, 'isActive', e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-600">Activo</span>
                            </label>
                            <button
                              onClick={() => removeService(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Nombre del Servicio
                          </label>
                          <input
                            type="text"
                            value={service.name}
                            onChange={(e) => updateService(index, 'name', e.target.value)}
                            disabled={!isEditing}
                            placeholder="Ej: Corte de cabello"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Descripción
                          </label>
                          <input
                            type="text"
                            value={service.description || ''}
                            onChange={(e) => updateService(index, 'description', e.target.value)}
                            disabled={!isEditing}
                            placeholder="Descripción opcional"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Duración (minutos)
                          </label>
                          <select
                            value={service.duration}
                            onChange={(e) => updateService(index, 'duration', parseInt(e.target.value))}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-600"
                          >
                            <option value={15}>15 minutos</option>
                            <option value={30}>30 minutos</option>
                            <option value={45}>45 minutos</option>
                            <option value={60}>1 hora</option>
                            <option value={90}>1.5 horas</option>
                            <option value={120}>2 horas</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Precio ({formData.currency})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={service.price}
                            onChange={(e) => updateService(index, 'price', parseInt(e.target.value) || 0)}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              
              {!isEditing && (activeTab === 'general' || activeTab === 'hours' || activeTab === 'appointments' || activeTab === 'services' || activeTab === 'notifications') && (
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
              
              {!isEditing && (activeTab === 'general' || activeTab === 'hours' || activeTab === 'appointments' || activeTab === 'services' || activeTab === 'notifications') && (
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
      
      {/* Modal de Configuración de Horarios */}
      {professionalScheduleModal.isOpen && professionalScheduleModal.professionalIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Configurar Horarios</h3>
                    <p className="text-sm text-gray-600">
                      {formData.appointmentSystem.professionals?.[professionalScheduleModal.professionalIndex]?.name || 'Profesional'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeScheduleModal}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Contenido del Modal */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-sm font-semibold text-blue-800">Información</h4>
                  </div>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Por defecto, los profesionales heredan los horarios de negocio configurados en la pestaña "Horarios". 
                    Aquí puedes personalizar horarios específicos para este profesional.
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Toggle para horarios personalizados */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={professionalScheduleForm.useCustomSchedule}
                        onChange={(e) => toggleCustomSchedule(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Usar horarios personalizados</span>
                    </label>
                  </div>
                  
                  {!professionalScheduleForm.useCustomSchedule ? (
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium mb-2">Horarios del negocio (se aplicarán por defecto):</p>
                      {days.map(({ key, name }) => {
                        const daySchedule = formData.businessHours[key];
                        return (
                          <div key={key} className="flex justify-between mt-1">
                            <span>{name}:</span>
                            <span>
                              {daySchedule?.isOpen 
                                ? `${daySchedule.openTime} - ${daySchedule.closeTime}`
                                : 'Cerrado'
                              }
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-800">Configurar horarios personalizados:</h4>
                      {days.map(({ key, name }) => (
                        <div key={key} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-20 text-sm font-medium text-gray-800">{name}</div>
                              
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={professionalScheduleForm.schedule[key]?.isOpen || false}
                                    onChange={(e) => updateProfessionalScheduleDay(key, {
                                      ...professionalScheduleForm.schedule[key],
                                      isOpen: e.target.checked,
                                      openTime: professionalScheduleForm.schedule[key]?.openTime || '09:00',
                                      closeTime: professionalScheduleForm.schedule[key]?.closeTime || '18:00',
                                    })}
                                    className="sr-only"
                                  />
                                  <div className={`w-8 h-4 rounded-full transition-colors duration-200 ${
                                    professionalScheduleForm.schedule[key]?.isOpen 
                                      ? 'bg-blue-600' 
                                      : 'bg-gray-300'
                                  }`}>
                                    <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                                      professionalScheduleForm.schedule[key]?.isOpen ? 'translate-x-4' : 'translate-x-0.5'
                                    } mt-0.5`}></div>
                                  </div>
                                </div>
                                <span className={`text-xs font-medium ${
                                  professionalScheduleForm.schedule[key]?.isOpen ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                  {professionalScheduleForm.schedule[key]?.isOpen ? 'Abierto' : 'Cerrado'}
                                </span>
                              </label>
                            </div>
                            
                            {professionalScheduleForm.schedule[key]?.isOpen && (
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  <label className="text-xs font-medium text-gray-600">De</label>
                                  <input
                                    type="time"
                                    value={professionalScheduleForm.schedule[key]?.openTime || '09:00'}
                                    onChange={(e) => updateProfessionalScheduleDay(key, {
                                      ...professionalScheduleForm.schedule[key],
                                      isOpen: professionalScheduleForm.schedule[key]?.isOpen || true,
                                      openTime: e.target.value,
                                      closeTime: professionalScheduleForm.schedule[key]?.closeTime || '18:00',
                                    })}
                                    className="px-2 py-1 bg-white border border-gray-300 rounded text-xs w-16"
                                  />
                                </div>
                                
                                <div className="text-xs text-gray-400">a</div>
                                
                                <div className="flex items-center space-x-1">
                                  <label className="text-xs font-medium text-gray-600">a</label>
                                  <input
                                    type="time"
                                    value={professionalScheduleForm.schedule[key]?.closeTime || '18:00'}
                                    onChange={(e) => updateProfessionalScheduleDay(key, {
                                      ...professionalScheduleForm.schedule[key],
                                      isOpen: professionalScheduleForm.schedule[key]?.isOpen || true,
                                      openTime: professionalScheduleForm.schedule[key]?.openTime || '09:00',
                                      closeTime: e.target.value,
                                    })}
                                    className="px-2 py-1 bg-white border border-gray-300 rounded text-xs w-16"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Botones */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={closeScheduleModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={updateProfessionalSchedule}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};