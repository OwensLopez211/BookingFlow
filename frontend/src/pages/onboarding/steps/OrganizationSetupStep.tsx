import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface OrganizationSetupStepProps {
  onComplete: (data: any) => void;
  isLoading: boolean;
  initialData?: any;
}

const timezones = [
  { value: 'America/Santiago', label: 'Chile (Santiago)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (Buenos Aires)' },
  { value: 'America/Lima', label: 'Perú (Lima)' },
  { value: 'America/Bogota', label: 'Colombia (Bogotá)' },
  { value: 'America/Mexico_City', label: 'México (Ciudad de México)' },
  { value: 'America/New_York', label: 'Estados Unidos (Nueva York)' },
  { value: 'Europe/Madrid', label: 'España (Madrid)' },
];

const currencies = [
  { value: 'CLP', label: 'Peso Chileno (CLP)', symbol: '$' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { value: 'ARS', label: 'Peso Argentino (ARS)', symbol: '$' },
  { value: 'PEN', label: 'Sol Peruano (PEN)', symbol: 'S/' },
  { value: 'COP', label: 'Peso Colombiano (COP)', symbol: '$' },
  { value: 'MXN', label: 'Peso Mexicano (MXN)', symbol: '$' },
];

const daysOfWeek = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

export const OrganizationSetupStep: React.FC<OrganizationSetupStepProps> = ({
  onComplete,
  isLoading,
  initialData
}) => {
  const defaultBusinessHours: BusinessHours = {
    monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    saturday: { isOpen: true, openTime: '09:00', closeTime: '14:00' },
    sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
  };

  const [formData, setFormData] = useState({
    businessName: initialData?.businessName || '',
    businessAddress: initialData?.businessAddress || '',
    businessPhone: initialData?.businessPhone || '',
    businessEmail: initialData?.businessEmail || '',
    timezone: initialData?.timezone || 'America/Santiago',
    currency: initialData?.currency || 'CLP',
    businessHours: initialData?.businessHours || defaultBusinessHours,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBusinessHoursChange = (day: string, field: 'isOpen' | 'openTime' | 'closeTime', value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
  };

  const setStandardHours = () => {
    setFormData(prev => ({
      ...prev,
      businessHours: defaultBusinessHours
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName.trim()) {
      alert('El nombre del negocio es requerido');
      return;
    }

    if (!formData.timezone || !formData.currency) {
      alert('Por favor selecciona la zona horaria y moneda');
      return;
    }

    onComplete(formData);
  };

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* Form Fields - Compact, no scroll */}
        <div className="flex-1 overflow-hidden">
          <div className="space-y-3">
            {/* Business Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nombre del negocio *
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                placeholder="Ej: Salón de Belleza María"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>

            {/* Business Address */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dirección del negocio
              </label>
              <input
                type="text"
                value={formData.businessAddress}
                onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                placeholder="Ej: Av. Providencia 1234, Santiago"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            {/* Business Phone & Email */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Teléfono del negocio
                </label>
                <input
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                  placeholder="Ej: +56 9 1234 5678"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email del negocio
                </label>
                <input
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                  placeholder="Ej: contacto@minsalon.com"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Timezone & Currency */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Zona horaria *
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Moneda *
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                >
                  {currencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Business Hours Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">
                  Horarios de atención
                </label>
                <button
                  type="button"
                  onClick={setStandardHours}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Horario estándar
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {daysOfWeek.map((day) => (
                  <div key={day.key} className="flex items-center space-x-2 text-xs">
                    <div className="w-16 text-gray-700">{day.label}</div>
                    <input
                      type="checkbox"
                      checked={formData.businessHours[day.key]?.isOpen || false}
                      onChange={(e) => handleBusinessHoursChange(day.key, 'isOpen', e.target.checked)}
                      className="w-3 h-3"
                    />
                    {formData.businessHours[day.key]?.isOpen && (
                      <>
                        <input
                          type="time"
                          value={formData.businessHours[day.key]?.openTime || '09:00'}
                          onChange={(e) => handleBusinessHoursChange(day.key, 'openTime', e.target.value)}
                          className="px-1 py-0.5 text-xs border border-gray-300 rounded"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="time"
                          value={formData.businessHours[day.key]?.closeTime || '18:00'}
                          onChange={(e) => handleBusinessHoursChange(day.key, 'closeTime', e.target.value)}
                          className="px-1 py-0.5 text-xs border border-gray-300 rounded"
                        />
                      </>
                    )}
                    {!formData.businessHours[day.key]?.isOpen && (
                      <span className="text-xs text-gray-400">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box - More compact */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-2">
                  <p className="text-xs text-blue-700">
                    Puedes cambiar estos datos más tarde desde la configuración.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Button - Fixed at bottom, more compact */}
        <div className="flex justify-end pt-2 border-t border-gray-100 mt-3">
          <Button
            type="submit"
            disabled={isLoading || !formData.businessName.trim()}
            className="px-4 py-1.5 text-sm"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                Guardando...
              </div>
            ) : (
              'Continuar'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};