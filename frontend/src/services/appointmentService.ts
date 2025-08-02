import { apiClient } from './apiClient';
import { formatCurrency } from '@/utils/currency';

export interface AppointmentData {
  id: string;
  title: string;
  client: string;
  phone?: string;
  date: string; // YYYY-MM-DD format
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  color?: string;
  professionalId?: string;
  professionalName?: string;
  resourceId?: string;
  resourceName?: string;
  serviceName?: string;
  servicePrice?: number;
  duration?: number;
  notes?: string;
  currency?: string;
}

export interface CreateAppointmentRequest {
  clientInfo: {
    name: string;
    phone: string;
    email: string;
  };
  serviceInfo: {
    name: string;
    duration: number;
    price: number;
  };
  datetime: string; // ISO string
  duration: number; // minutes
  preferredStaffId?: string;
  preferredResourceId?: string;
  notes?: string;
}

export interface AppointmentStats {
  total: number;
  confirmed: number;
  pending: number;
  completed: number;
  cancelled: number;
}

export interface GetAppointmentsParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  staffId?: string;
  resourceId?: string;
  status?: string;
}

class AppointmentService {
  /**
   * Get appointments by date range with optional filtering
   */
  async getAppointments(params: GetAppointmentsParams): Promise<AppointmentData[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', params.startDate);
      queryParams.append('endDate', params.endDate);
      
      if (params.staffId) {
        queryParams.append('staffId', params.staffId);
      }
      if (params.resourceId) {
        queryParams.append('resourceId', params.resourceId);
      }
      if (params.status) {
        queryParams.append('status', params.status);
      }

      const response = await apiClient.get(`/appointments?${queryParams.toString()}`);
      
      if (!response.data.data) {
        return [];
      }

      // Transform backend data to frontend format
      return this.transformAppointments(response.data.data);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      if (error.response?.status === 404) {
        return [];
      }
      throw new Error(error.response?.data?.error || 'Error al obtener las citas');
    }
  }

  /**
   * Get appointments for a specific date
   */
  async getAppointmentsByDate(date: string, staffId?: string, resourceId?: string): Promise<AppointmentData[]> {
    return this.getAppointments({
      startDate: date,
      endDate: date,
      staffId,
      resourceId
    });
  }

  /**
   * Get appointment statistics for a date range
   */
  async getAppointmentStats(startDate: string, endDate: string): Promise<AppointmentStats> {
    try {
      const response = await apiClient.get(`/appointments/stats?startDate=${startDate}&endDate=${endDate}`);
      return response.data.data || {
        total: 0,
        confirmed: 0,
        pending: 0,
        completed: 0,
        cancelled: 0
      };
    } catch (error: any) {
      console.error('Error fetching appointment stats:', error);
      return {
        total: 0,
        confirmed: 0,
        pending: 0,
        completed: 0,
        cancelled: 0
      };
    }
  }

  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<AppointmentData> {
    try {
      const response = await apiClient.post('/appointments', appointmentData);
      return this.transformAppointment(response.data.data);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      throw new Error(error.response?.data?.error || 'Error al crear la cita');
    }
  }

  /**
   * Update an appointment
   */
  async updateAppointment(appointmentId: string, updates: Partial<AppointmentData>): Promise<AppointmentData> {
    try {
      const response = await apiClient.put(`/appointments/${appointmentId}`, updates);
      return this.transformAppointment(response.data.data);
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      throw new Error(error.response?.data?.error || 'Error al actualizar la cita');
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<AppointmentData> {
    try {
      const response = await apiClient.post(`/appointments/${appointmentId}/cancel`, { reason });
      return this.transformAppointment(response.data.data);
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      throw new Error(error.response?.data?.error || 'Error al cancelar la cita');
    }
  }

  /**
   * Confirm an appointment
   */
  async confirmAppointment(appointmentId: string): Promise<AppointmentData> {
    try {
      const response = await apiClient.post(`/appointments/${appointmentId}/confirm`);
      return this.transformAppointment(response.data.data);
    } catch (error: any) {
      console.error('Error confirming appointment:', error);
      throw new Error(error.response?.data?.error || 'Error al confirmar la cita');
    }
  }

  /**
   * Complete an appointment
   */
  async completeAppointment(appointmentId: string): Promise<AppointmentData> {
    try {
      const response = await apiClient.post(`/appointments/${appointmentId}/complete`);
      return this.transformAppointment(response.data.data);
    } catch (error: any) {
      console.error('Error completing appointment:', error);
      throw new Error(error.response?.data?.error || 'Error al completar la cita');
    }
  }

  /**
   * Mark appointment as no-show
   */
  async markNoShow(appointmentId: string): Promise<AppointmentData> {
    try {
      const response = await apiClient.post(`/appointments/${appointmentId}/no-show`);
      return this.transformAppointment(response.data.data);
    } catch (error: any) {
      console.error('Error marking no-show:', error);
      throw new Error(error.response?.data?.error || 'Error al marcar como no asistió');
    }
  }

  /**
   * Transform backend appointment data to frontend format
   */
  private transformAppointments(backendAppointments: any[]): AppointmentData[] {
    return backendAppointments.map(apt => this.transformAppointment(apt));
  }

  /**
   * Transform single backend appointment to frontend format
   */
  private transformAppointment(backendAppointment: any): AppointmentData {
    // Handle both old format (datetime) and new format (date + time)
    let datetime: Date;
    if (backendAppointment.datetime) {
      datetime = new Date(backendAppointment.datetime);
    } else if (backendAppointment.date && backendAppointment.time) {
      // Create datetime in local timezone, not UTC
      datetime = new Date(`${backendAppointment.date}T${backendAppointment.time}:00`);
    } else {
      console.error('Invalid appointment datetime format:', backendAppointment);
      datetime = new Date(); // fallback
    }
    
    const duration = backendAppointment.serviceDuration || backendAppointment.duration || 60;
    const endTime = new Date(datetime.getTime() + (duration * 60000));
    
    console.log('🔧 Appointment transformation:', {
      original: { date: backendAppointment.date, time: backendAppointment.time },
      datetime: datetime.toString(),
      startTime: datetime.toTimeString().substring(0, 5),
      endTime: endTime.toTimeString().substring(0, 5),
      duration
    });
    
    // Generate display title
    const serviceName = backendAppointment.serviceInfo?.name || 'Servicio';
    const title = serviceName;

    // Determine color based on status
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'confirmed':
          return 'bg-green-50 border-green-200';
        case 'pending':
          return 'bg-yellow-50 border-yellow-200';
        case 'completed':
          return 'bg-blue-50 border-blue-200';
        case 'cancelled':
          return 'bg-red-50 border-red-200';
        default:
          return 'bg-gray-50 border-gray-200';
      }
    };

    return {
      id: backendAppointment.id,
      title,
      client: backendAppointment.clientInfo?.name || backendAppointment.clientName || 'Cliente',
      phone: backendAppointment.clientInfo?.phone || backendAppointment.clientPhone,
      date: backendAppointment.date || datetime.toISOString().split('T')[0], // YYYY-MM-DD
      startTime: backendAppointment.time || datetime.toTimeString().substring(0, 5), // Use original time if available
      endTime: backendAppointment.time ? 
        (() => {
          const [hours, minutes] = backendAppointment.time.split(':').map(Number);
          const endDate = new Date();
          endDate.setHours(hours, minutes + duration, 0, 0);
          return endDate.toTimeString().substring(0, 5);
        })() :
        endTime.toTimeString().substring(0, 5), // HH:MM
      status: backendAppointment.status,
      color: getStatusColor(backendAppointment.status),
      professionalId: backendAppointment.staffId || backendAppointment.professionalId,
      professionalName: backendAppointment.staffName, // Si está disponible en la respuesta
      resourceId: backendAppointment.resourceId,
      resourceName: backendAppointment.resourceName, // Si está disponible en la respuesta
      serviceName: backendAppointment.serviceInfo?.name || backendAppointment.serviceName,
      servicePrice: backendAppointment.serviceInfo?.price || backendAppointment.servicePrice,
      duration: duration,
      notes: backendAppointment.notes,
      currency: backendAppointment.currency || 'CLP'
    };
  }

  /**
   * Get appointments grouped by date for calendar display
   */
  async getAppointmentCounts(startDate: string, endDate: string): Promise<Record<string, number>> {
    try {
      const appointments = await this.getAppointments({ startDate, endDate });
      const counts: Record<string, number> = {};
      
      appointments.forEach(appointment => {
        const dateKey = appointment.date;
        counts[dateKey] = (counts[dateKey] || 0) + 1;
      });
      
      return counts;
    } catch (error) {
      console.error('Error getting appointment counts:', error);
      return {};
    }
  }
}

export const appointmentService = new AppointmentService();