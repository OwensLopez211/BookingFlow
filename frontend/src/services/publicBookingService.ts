import { apiClient } from './apiClient';

export interface PublicOrganization {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  settings: {
    timezone: string;
    businessHours: Record<string, {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    }>;
    appointmentSystem: {
      appointmentModel: 'professional_based' | 'resource_based' | 'hybrid';
      allowClientSelection: boolean;
      bufferBetweenAppointments: number;
      maxAdvanceBookingDays: number;
      maxResources?: number;
      maxProfessionals?: number;
    };
  };
}

export interface PublicService {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
}

export interface PublicProfessional {
  id: string;
  name: string;
  photo?: string;
  schedule?: Record<string, {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }>;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
  professionalId?: string;
  availableCount?: number; // For resource-based systems
  resourceSlot?: number; // Individual resource slot number (1, 2, 3...)
  totalResourceSlots?: number; // Total slots available for this time
}

export interface DailyAvailabilityCount {
  date: string;
  availableSlots: number;
}

export interface CreateAppointmentRequest {
  serviceId: string;
  professionalId?: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes?: string;
}

export interface CreatedAppointment {
  id: string;
  organizationId: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  professionalId?: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
  status: string;
  createdAt: string;
}

export const publicBookingService = {
  // Get public organization data
  async getOrganization(orgId: string): Promise<PublicOrganization> {
    try {
      const response = await apiClient.get(`/public/organization/${orgId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener organización');
      }
      
      return response.data.organization;
    } catch (error: any) {
      console.error('Error getting public organization:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener información de la organización');
    }
  },

  // Get active services
  async getServices(orgId: string): Promise<PublicService[]> {
    try {
      const response = await apiClient.get(`/public/organization/${orgId}/services`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener servicios');
      }
      
      return response.data.services;
    } catch (error: any) {
      console.error('Error getting public services:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener servicios');
    }
  },

  // Get active professionals (only for professional-based organizations)
  async getProfessionals(orgId: string): Promise<PublicProfessional[]> {
    try {
      const response = await apiClient.get(`/public/organization/${orgId}/professionals`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener profesionales');
      }
      
      return response.data.professionals;
    } catch (error: any) {
      console.error('Error getting public professionals:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener profesionales');
    }
  },

  // Get daily availability counts for multiple dates
  async getDailyAvailabilityCounts(
    orgId: string,
    dates: string[],
    serviceDuration: number,
    professionalId?: string
  ): Promise<DailyAvailabilityCount[]> {
    try {
      const params = new URLSearchParams({
        dates: dates.join(','),
        serviceDuration: serviceDuration.toString(),
      });
      
      if (professionalId) {
        params.append('professionalId', professionalId);
      }
      
      const response = await apiClient.get(
        `/public/organization/${orgId}/availability/daily-counts?${params.toString()}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener disponibilidad diaria');
      }
      
      return response.data.dailyCounts;
    } catch (error: any) {
      console.error('Error getting daily availability counts:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener disponibilidad diaria');
    }
  },

  // Get availability slots for a specific date
  async getAvailability(
    orgId: string, 
    date: string, 
    serviceDuration: number,
    professionalId?: string
  ): Promise<AvailabilitySlot[]> {
    try {
      const params = new URLSearchParams({
        date,
        serviceDuration: serviceDuration.toString(),
      });
      
      if (professionalId) {
        params.append('professionalId', professionalId);
      }
      
      const response = await apiClient.get(
        `/public/organization/${orgId}/availability?${params.toString()}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener disponibilidad');
      }
      
      return response.data.availability;
    } catch (error: any) {
      console.error('Error getting availability:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener disponibilidad');
    }
  },

  // Create a new appointment
  async createAppointment(
    orgId: string, 
    appointmentData: CreateAppointmentRequest
  ): Promise<CreatedAppointment> {
    try {
      const response = await apiClient.post(
        `/public/organization/${orgId}/appointments`,
        appointmentData
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al crear la cita');
      }
      
      return response.data.appointment;
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      throw new Error(error.response?.data?.message || 'Error al crear la cita');
    }
  },
};