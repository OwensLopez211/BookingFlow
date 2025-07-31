import { 
  Appointment, 
  BusinessConfiguration, 
  Staff, 
  Resource,
  ClientInfo,
  ServiceInfo
} from '../../../shared/types/business';
import * as appointmentRepo from '../repositories/appointmentRepository';
import * as businessConfigRepo from '../repositories/businessConfigurationRepository';
import * as staffRepo from '../repositories/staffRepository';
import * as resourceRepo from '../repositories/resourceRepository';
import * as availabilityService from './availabilityService';

export interface CreateAppointmentRequest {
  orgId: string;
  clientInfo: ClientInfo;
  serviceInfo: ServiceInfo;
  datetime: string;
  duration: number;
  preferredStaffId?: string;
  preferredResourceId?: string;
  customFields?: { [fieldId: string]: any };
  notes?: string;
}

export interface AppointmentAssignment {
  staffId?: string;
  resourceId?: string;
  assignmentType: 'staff_only' | 'resource_only' | 'staff_and_resource';
}

export const createAppointment = async (request: CreateAppointmentRequest): Promise<Appointment> => {
  // Get business configuration to understand appointment model
  const businessConfig = await businessConfigRepo.getBusinessConfigurationByOrgId(request.orgId);
  if (!businessConfig) {
    throw new Error('Business configuration not found');
  }

  // Validate appointment timing
  await validateAppointmentTiming(request, businessConfig);

  // Determine assignment based on business model
  const assignment = await determineAppointmentAssignment(request, businessConfig);

  // Reserve the time slots
  await reserveTimeSlots(request, assignment);

  // Create the appointment
  const appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
    orgId: request.orgId,
    staffId: assignment.staffId,
    resourceId: assignment.resourceId,
    clientInfo: request.clientInfo,
    serviceInfo: request.serviceInfo,
    datetime: request.datetime,
    duration: request.duration,
    status: businessConfig.settings.notificationSettings.requireConfirmation ? 'pending' : 'confirmed',
    assignmentType: assignment.assignmentType,
    notes: request.notes,
    customFields: request.customFields,
  };

  try {
    const appointment = await appointmentRepo.createAppointment(appointmentData);
    
    // TODO: Send notifications if configured
    
    return appointment;
  } catch (error) {
    // If appointment creation fails, release the reserved slots
    await releaseReservedSlots(request, assignment);
    throw error;
  }
};

export const updateAppointment = async (
  orgId: string,
  appointmentId: string,
  updates: Partial<Appointment>
): Promise<Appointment> => {
  const currentAppointment = await appointmentRepo.getAppointmentById(orgId, appointmentId);
  if (!currentAppointment) {
    throw new Error('Appointment not found');
  }

  // If datetime or assignments are changing, handle slot reservations
  const isRescheduling = updates.datetime && updates.datetime !== currentAppointment.datetime;
  const isReassigning = updates.staffId !== currentAppointment.staffId || 
                       updates.resourceId !== currentAppointment.resourceId;

  if (isRescheduling || isReassigning) {
    // Release current slots
    await releaseCurrentSlots(currentAppointment);
    
    // Reserve new slots
    const newAssignment: AppointmentAssignment = {
      staffId: updates.staffId ?? currentAppointment.staffId,
      resourceId: updates.resourceId ?? currentAppointment.resourceId,
      assignmentType: updates.assignmentType ?? currentAppointment.assignmentType,
    };

    const tempRequest: CreateAppointmentRequest = {
      orgId,
      clientInfo: currentAppointment.clientInfo,
      serviceInfo: currentAppointment.serviceInfo,
      datetime: updates.datetime ?? currentAppointment.datetime,
      duration: updates.duration ?? currentAppointment.duration,
    };

    await reserveTimeSlots(tempRequest, newAssignment);
  }

  return appointmentRepo.updateAppointment(orgId, appointmentId, updates);
};

export const cancelAppointment = async (
  orgId: string,
  appointmentId: string,
  cancelledBy: 'client' | 'staff' | 'admin',
  reason?: string
): Promise<Appointment> => {
  const appointment = await appointmentRepo.getAppointmentById(orgId, appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Release the time slots
  await releaseCurrentSlots(appointment);

  // Apply cancellation policy if applicable
  const businessConfig = await businessConfigRepo.getBusinessConfigurationByOrgId(orgId);
  let penaltyApplied = 0;

  if (businessConfig && cancelledBy === 'client') {
    const hoursUntilAppointment = getHoursUntilAppointment(appointment.datetime);
    if (hoursUntilAppointment < businessConfig.settings.cancellationPolicy.hoursBeforeAppointment) {
      penaltyApplied = businessConfig.settings.cancellationPolicy.penaltyPercentage || 0;
    }
  }

  return appointmentRepo.cancelAppointment(orgId, appointmentId, cancelledBy, reason, penaltyApplied);
};

export const rescheduleAppointment = async (
  orgId: string,
  appointmentId: string,
  newDatetime: string,
  rescheduledBy: string,
  reason?: string
): Promise<Appointment> => {
  const appointment = await appointmentRepo.getAppointmentById(orgId, appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Validate new timing
  const businessConfig = await businessConfigRepo.getBusinessConfigurationByOrgId(orgId);
  if (businessConfig) {
    const tempRequest: CreateAppointmentRequest = {
      orgId,
      clientInfo: appointment.clientInfo,
      serviceInfo: appointment.serviceInfo,
      datetime: newDatetime,
      duration: appointment.duration,
    };
    await validateAppointmentTiming(tempRequest, businessConfig);
  }

  // Release current slots
  await releaseCurrentSlots(appointment);

  // Reserve new slots with same assignments
  const assignment: AppointmentAssignment = {
    staffId: appointment.staffId,
    resourceId: appointment.resourceId,
    assignmentType: appointment.assignmentType,
  };

  const tempRequest: CreateAppointmentRequest = {
    orgId,
    clientInfo: appointment.clientInfo,
    serviceInfo: appointment.serviceInfo,
    datetime: newDatetime,
    duration: appointment.duration,
  };

  await reserveTimeSlots(tempRequest, assignment);

  return appointmentRepo.rescheduleAppointment(orgId, appointmentId, newDatetime, rescheduledBy, reason);
};

export const getAppointmentsByDateRange = async (
  orgId: string,
  startDate: string,
  endDate: string,
  staffId?: string,
  resourceId?: string
): Promise<Appointment[]> => {
  if (staffId) {
    return appointmentRepo.getAppointmentsByStaffAndDateRange(staffId, startDate, endDate);
  } else if (resourceId) {
    return appointmentRepo.getAppointmentsByResource(orgId, resourceId, startDate, endDate);
  } else {
    return appointmentRepo.getAppointmentsByOrgAndDateRange(orgId, startDate, endDate);
  }
};

// Private helper functions
const validateAppointmentTiming = async (
  request: CreateAppointmentRequest,
  businessConfig: BusinessConfiguration
): Promise<void> => {
  const appointmentDate = new Date(request.datetime);
  const now = new Date();

  // Check if appointment is too far in advance
  const daysInAdvance = Math.ceil((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysInAdvance > businessConfig.settings.maxAdvanceBookingDays) {
    throw new Error(`Appointments can only be booked ${businessConfig.settings.maxAdvanceBookingDays} days in advance`);
  }

  // Check if appointment is in the past
  if (appointmentDate < now) {
    throw new Error('Cannot book appointments in the past');
  }
};

const determineAppointmentAssignment = async (
  request: CreateAppointmentRequest,
  businessConfig: BusinessConfiguration
): Promise<AppointmentAssignment> => {
  const appointmentDate = request.datetime.split('T')[0];

  switch (businessConfig.appointmentModel) {
    case 'professional_based':
      return await assignProfessionalBased(request, appointmentDate);
    
    case 'resource_based':
      return await assignResourceBased(request, appointmentDate);
    
    case 'hybrid':
      return await assignHybrid(request, appointmentDate, businessConfig);
    
    default:
      throw new Error('Invalid appointment model configuration');
  }
};

const assignProfessionalBased = async (
  request: CreateAppointmentRequest,
  appointmentDate: string
): Promise<AppointmentAssignment> => {
  let staffId = request.preferredStaffId;

  if (!staffId) {
    // Auto-assign available staff
    const availableSlots = await availabilityService.findAvailableSlots(
      request.orgId,
      appointmentDate,
      request.duration,
      'staff'
    );

    if (availableSlots.length === 0) {
      throw new Error('No staff available for the requested time');
    }

    staffId = availableSlots[0].entityId;
  }

  // Verify staff availability
  const availableSlot = await availabilityService.findAvailableSlots(
    request.orgId,
    appointmentDate,
    request.duration,
    'staff',
    staffId
  );

  if (availableSlot.length === 0) {
    throw new Error('Selected staff member is not available');
  }

  return {
    staffId,
    assignmentType: 'staff_only',
  };
};

const assignResourceBased = async (
  request: CreateAppointmentRequest,
  appointmentDate: string
): Promise<AppointmentAssignment> => {
  let resourceId = request.preferredResourceId;

  if (!resourceId) {
    // Auto-assign available resource
    const availableSlots = await availabilityService.findAvailableSlots(
      request.orgId,
      appointmentDate,
      request.duration,
      'resource'
    );

    if (availableSlots.length === 0) {
      throw new Error('No resources available for the requested time');
    }

    resourceId = availableSlots[0].entityId;
  }

  // Verify resource availability
  const availableSlot = await availabilityService.findAvailableSlots(
    request.orgId,
    appointmentDate,
    request.duration,
    'resource',
    resourceId
  );

  if (availableSlot.length === 0) {
    throw new Error('Selected resource is not available');
  }

  return {
    resourceId,
    assignmentType: 'resource_only',
  };
};

const assignHybrid = async (
  request: CreateAppointmentRequest,
  appointmentDate: string,
  businessConfig: BusinessConfiguration
): Promise<AppointmentAssignment> => {
  const requiresBoth = businessConfig.settings.requireResourceAssignment;
  
  if (requiresBoth) {
    // Both staff and resource required
    const staffAssignment = await assignProfessionalBased(request, appointmentDate);
    const resourceAssignment = await assignResourceBased(request, appointmentDate);

    return {
      staffId: staffAssignment.staffId,
      resourceId: resourceAssignment.resourceId,
      assignmentType: 'staff_and_resource',
    };
  } else {
    // Either staff or resource (client preference or auto-assign)
    if (request.preferredStaffId) {
      return await assignProfessionalBased(request, appointmentDate);
    } else if (request.preferredResourceId) {
      return await assignResourceBased(request, appointmentDate);
    } else {
      // Auto-assign based on availability
      const staffSlots = await availabilityService.findAvailableSlots(
        request.orgId,
        appointmentDate,
        request.duration,
        'staff'
      );
      
      const resourceSlots = await availabilityService.findAvailableSlots(
        request.orgId,
        appointmentDate,
        request.duration,
        'resource'
      );

      if (staffSlots.length > 0) {
        return { staffId: staffSlots[0].entityId, assignmentType: 'staff_only' };
      } else if (resourceSlots.length > 0) {
        return { resourceId: resourceSlots[0].entityId, assignmentType: 'resource_only' };
      } else {
        throw new Error('No availability found for the requested time');
      }
    }
  }
};

const reserveTimeSlots = async (
  request: CreateAppointmentRequest,
  assignment: AppointmentAssignment
): Promise<void> => {
  const appointmentDate = request.datetime.split('T')[0];
  const startTime = request.datetime.split('T')[1].substring(0, 5); // HH:MM
  const tempAppointmentId = `temp-${Date.now()}`; // Temporary ID for reservation

  if (assignment.staffId) {
    await availabilityService.bookSlot(
      request.orgId,
      'staff',
      assignment.staffId,
      appointmentDate,
      startTime,
      request.duration,
      tempAppointmentId
    );
  }

  if (assignment.resourceId) {
    await availabilityService.bookSlot(
      request.orgId,
      'resource',
      assignment.resourceId,
      appointmentDate,
      startTime,
      request.duration,
      tempAppointmentId
    );
  }
};

const releaseReservedSlots = async (
  request: CreateAppointmentRequest,
  assignment: AppointmentAssignment
): Promise<void> => {
  const appointmentDate = request.datetime.split('T')[0];
  const tempAppointmentId = `temp-${Date.now()}`;

  if (assignment.staffId) {
    await availabilityService.releaseSlot(
      request.orgId,
      'staff',
      assignment.staffId,
      appointmentDate,
      tempAppointmentId
    );
  }

  if (assignment.resourceId) {
    await availabilityService.releaseSlot(
      request.orgId,
      'resource',
      assignment.resourceId,
      appointmentDate,
      tempAppointmentId
    );
  }
};

const releaseCurrentSlots = async (appointment: Appointment): Promise<void> => {
  const appointmentDate = appointment.datetime.split('T')[0];

  if (appointment.staffId) {
    await availabilityService.releaseSlot(
      appointment.orgId,
      'staff',
      appointment.staffId,
      appointmentDate,
      appointment.id
    );
  }

  if (appointment.resourceId) {
    await availabilityService.releaseSlot(
      appointment.orgId,
      'resource',
      appointment.resourceId,
      appointmentDate,
      appointment.id
    );
  }
};

const getHoursUntilAppointment = (appointmentDatetime: string): number => {
  const appointmentDate = new Date(appointmentDatetime);
  const now = new Date();
  return Math.ceil((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60));
};