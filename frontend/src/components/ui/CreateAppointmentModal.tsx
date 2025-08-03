import React, { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, UserIcon, PhoneIcon, EnvelopeIcon, CreditCardIcon } from '@heroicons/react/24/outline';

interface Professional {
  id: string;
  name: string;
  photo?: string;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appointmentData: any) => void;
  selectedDate: Date;
  selectedTime?: string;
  selectedProfessionalId?: string;
  professionals: Professional[];
  services?: Service[];
}

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedDate,
  selectedTime,
  selectedProfessionalId,
  professionals,
  services = []
}) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    professionalId: selectedProfessionalId || '',
    serviceId: '',
    startTime: selectedTime || '',
    endTime: '',
    duration: 60,
    notes: '',
    status: 'confirmed' as 'confirmed' | 'pending'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        professionalId: selectedProfessionalId || '',
        serviceId: '',
        startTime: selectedTime || '',
        endTime: '',
        duration: 60,
        notes: '',
        status: 'confirmed'
      });
      setErrors({});
    }
  }, [isOpen, selectedTime, selectedProfessionalId]);

  // Calculate end time when start time or duration changes
  useEffect(() => {
    if (formData.startTime && formData.duration) {
      const [hours, minutes] = formData.startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + formData.duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      
      setFormData(prev => ({
        ...prev,
        endTime: `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
      }));
    }
  }, [formData.startTime, formData.duration]);

  // Update duration when service changes
  useEffect(() => {
    const selectedService = services.find(s => s.id === formData.serviceId);
    if (selectedService) {
      setFormData(prev => ({
        ...prev,
        duration: selectedService.duration
      }));
    }
  }, [formData.serviceId, services]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'El nombre del cliente es requerido';
    }

    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = 'El teléfono del cliente es requerido';
    }

    if (!formData.serviceId && services.length > 0) {
      newErrors.serviceId = 'Debe seleccionar un servicio';
    }

    if (!formData.professionalId) {
      newErrors.professionalId = 'Debe seleccionar un profesional';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'La hora de inicio es requerida';
    }

    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = 'La duración debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Get the service name for the title
    const selectedService = services.find(s => s.id === formData.serviceId);
    const title = selectedService ? selectedService.name : 'Consulta general';

    const appointmentData = {
      ...formData,
      title,
      date: selectedDate.toISOString().split('T')[0],
      clientInfo: {
        name: formData.clientName,
        phone: formData.clientPhone,
        email: formData.clientEmail
      }
    };

    onSubmit(appointmentData);
  };

  if (!isOpen) return null;

  const selectedProfessional = professionals.find(p => p.id === formData.professionalId);
  const selectedService = services.find(s => s.id === formData.serviceId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Nueva Cita
              </h3>
              <p className="text-sm text-gray-600">
                {selectedDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Information */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.clientName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nombre completo"
                  />
                </div>
                {errors.clientName && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.clientPhone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
                {errors.clientPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientPhone}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Opcional)
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profesional *
                </label>
                <select
                  value={formData.professionalId}
                  onChange={(e) => handleInputChange('professionalId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.professionalId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar profesional</option>
                  {professionals.map(professional => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>
                {errors.professionalId && (
                  <p className="mt-1 text-sm text-red-600">{errors.professionalId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servicio {services.length > 0 ? '*' : '(Opcional)'}
                </label>
                {services.length > 0 ? (
                  <select
                    value={formData.serviceId}
                    onChange={(e) => handleInputChange('serviceId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.serviceId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar servicio</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.duration}min - ${service.price}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
                    No hay servicios configurados
                  </div>
                )}
                {errors.serviceId && (
                  <p className="mt-1 text-sm text-red-600">{errors.serviceId}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="confirmed">Confirmada</option>
                <option value="pending">Pendiente</option>
              </select>
            </div>

            {/* Time and Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Inicio *
                </label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.startTime ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (min) *
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.duration ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Fin
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (Opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Información adicional sobre la cita..."
              />
            </div>

            {/* Summary */}
            {selectedProfessional && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Resumen de la Cita</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>
                    <span className="font-medium">Profesional:</span> {selectedProfessional.name}
                  </div>
                  <div>
                    <span className="font-medium">Cliente:</span> {formData.clientName || 'Sin nombre'}
                  </div>
                  <div>
                    <span className="font-medium">Horario:</span> {formData.startTime} - {formData.endTime}
                  </div>
                  <div>
                    <span className="font-medium">Duración:</span> {formData.duration} minutos
                  </div>
                  {selectedService && (
                    <>
                      <div>
                        <span className="font-medium">Servicio:</span> {selectedService.name}
                      </div>
                      <div>
                        <span className="font-medium">Precio:</span> ${selectedService.price}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
              >
                <CreditCardIcon className="w-4 h-4" />
                <span>Crear Cita</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};