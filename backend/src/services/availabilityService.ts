import { 
  Availability, 
  AvailabilitySlot, 
  Staff, 
  Resource, 
  WeeklySchedule,
  ResourceDaySchedule
} from '../../../shared/types/business';
import * as availabilityRepo from '../repositories/availabilityRepository';
import * as staffRepo from '../repositories/staffRepository';
import * as resourceRepo from '../repositories/resourceRepository';
import * as appointmentRepo from '../repositories/appointmentRepository';

export interface AvailabilityGenerationOptions {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  slotDuration: number; // minutes
  override?: boolean; // Override existing availability
}

export interface AvailableSlotResult {
  entityType: 'staff' | 'resource';
  entityId: string;
  entityName: string;
  date: string;
  slots: AvailabilitySlot[];
}

export const generateAvailabilityForStaff = async (
  orgId: string,
  staffId: string,
  options: AvailabilityGenerationOptions
): Promise<void> => {
  const staff = await staffRepo.getStaffById(orgId, staffId);
  if (!staff || !staff.isActive) {
    throw new Error('Staff member not found or inactive');
  }

  const dates = getDatesBetween(options.startDate, options.endDate);
  
  for (const date of dates) {
    const dayOfWeek = getDayOfWeek(date);
    const daySchedule = staff.schedule[dayOfWeek];
    
    if (!daySchedule.isAvailable) {
      continue;
    }

    // Check if availability already exists
    const existingAvailability = await availabilityRepo.getAvailabilityByEntity('staff', staffId, date);
    
    if (existingAvailability && !options.override) {
      continue;
    }

    const timeSlots = generateTimeSlotsFromSchedule(daySchedule, options.slotDuration);
    
    const availabilityData = {
      orgId,
      entityType: 'staff' as const,
      entityId: staffId,
      date,
      timeSlots,
      isActive: true,
      override: options.override || false,
    };

    if (existingAvailability) {
      await availabilityRepo.updateAvailability(orgId, 'staff', staffId, date, availabilityData);
    } else {
      await availabilityRepo.createAvailability(availabilityData);
    }
  }
};

export const generateAvailabilityForResource = async (
  orgId: string,
  resourceId: string,
  options: AvailabilityGenerationOptions
): Promise<void> => {
  const resource = await resourceRepo.getResourceById(orgId, resourceId);
  if (!resource || !resource.isActive) {
    throw new Error('Resource not found or inactive');
  }

  const dates = getDatesBetween(options.startDate, options.endDate);
  
  for (const date of dates) {
    const dayOfWeek = getDayOfWeek(date);
    const daySchedule = resource.schedule[dayOfWeek];
    
    if (!daySchedule.isAvailable) {
      continue;
    }

    // Check if availability already exists
    const existingAvailability = await availabilityRepo.getAvailabilityByEntity('resource', resourceId, date);
    
    if (existingAvailability && !options.override) {
      continue;
    }

    const timeSlots = generateTimeSlotsFromSchedule(daySchedule, options.slotDuration);
    
    const availabilityData = {
      orgId,
      entityType: 'resource' as const,
      entityId: resourceId,
      date,
      timeSlots,
      isActive: true,
      override: options.override || false,
    };

    if (existingAvailability) {
      await availabilityRepo.updateAvailability(orgId, 'resource', resourceId, date, availabilityData);
    } else {
      await availabilityRepo.createAvailability(availabilityData);
    }
  }
};

export const generateAvailabilityForOrganization = async (
  orgId: string,
  options: AvailabilityGenerationOptions
): Promise<void> => {
  // Generate for all active staff
  const staff = await staffRepo.getStaffByOrgId(orgId, true);
  for (const staffMember of staff) {
    await generateAvailabilityForStaff(orgId, staffMember.id, options);
  }

  // Generate for all active resources
  const resources = await resourceRepo.getResourcesByOrgId(orgId, true);
  for (const resource of resources) {
    await generateAvailabilityForResource(orgId, resource.id, options);
  }
};

export const findAvailableSlots = async (
  orgId: string,
  date: string,
  duration: number,
  entityType?: 'staff' | 'resource',
  entityId?: string,
  requiredSpecialties?: string[]
): Promise<AvailableSlotResult[]> => {
  const results: AvailableSlotResult[] = [];

  if (entityType && entityId) {
    // Specific entity requested
    const slots = await availabilityRepo.getAvailableTimeSlots(entityType, entityId, date, duration);
    if (slots.length > 0) {
      const entityName = await getEntityName(orgId, entityType, entityId);
      results.push({
        entityType,
        entityId,
        entityName,
        date,
        slots,
      });
    }
  } else if (entityType === 'staff') {
    // All staff availability
    let staff = await staffRepo.getStaffByOrgId(orgId, true);
    
    if (requiredSpecialties && requiredSpecialties.length > 0) {
      staff = staff.filter(s => 
        requiredSpecialties.some(specialty => s.specialties.includes(specialty))
      );
    }

    for (const staffMember of staff) {
      const slots = await availabilityRepo.getAvailableTimeSlots('staff', staffMember.id, date, duration);
      if (slots.length > 0) {
        results.push({
          entityType: 'staff',
          entityId: staffMember.id,
          entityName: `${staffMember.firstName} ${staffMember.lastName}`,
          date,
          slots,
        });
      }
    }
  } else if (entityType === 'resource') {
    // All resource availability
    const resources = await resourceRepo.getResourcesByOrgId(orgId, true);

    for (const resource of resources) {
      const slots = await availabilityRepo.getAvailableTimeSlots('resource', resource.id, date, duration);
      if (slots.length > 0) {
        results.push({
          entityType: 'resource',
          entityId: resource.id,
          entityName: resource.name,
          date,
          slots,
        });
      }
    }
  } else {
    // All availability (staff and resources)
    const staffResults = await findAvailableSlots(orgId, date, duration, 'staff', undefined, requiredSpecialties);
    const resourceResults = await findAvailableSlots(orgId, date, duration, 'resource');
    
    results.push(...staffResults, ...resourceResults);
  }

  return results;
};

export const bookSlot = async (
  orgId: string,
  entityType: 'staff' | 'resource',
  entityId: string,
  date: string,
  startTime: string,
  duration: number,
  appointmentId: string
): Promise<void> => {
  const endTime = addMinutesToTime(startTime, duration);
  
  // Check if slot is still available
  const availableSlot = await availabilityRepo.findAvailableSlot(entityType, entityId, date, duration, startTime);
  if (!availableSlot) {
    throw new Error('Time slot is no longer available');
  }

  // Book the slot
  await availabilityRepo.bookTimeSlot(orgId, entityType, entityId, date, startTime, endTime, appointmentId);
};

export const releaseSlot = async (
  orgId: string,
  entityType: 'staff' | 'resource',
  entityId: string,
  date: string,
  appointmentId: string
): Promise<void> => {
  await availabilityRepo.releaseTimeSlot(orgId, entityType, entityId, date, appointmentId);
};

export const getEntityAvailability = async (
  orgId: string,
  entityType: 'staff' | 'resource',
  entityId: string,
  startDate: string,
  endDate: string
): Promise<Availability[]> => {
  return availabilityRepo.getAvailabilityByEntityDateRange(entityType, entityId, startDate, endDate);
};

export const blockTimeSlot = async (
  orgId: string,
  entityType: 'staff' | 'resource',
  entityId: string,
  date: string,
  startTime: string,
  endTime: string,
  reason: string,
  customReason?: string
): Promise<void> => {
  const availability = await availabilityRepo.getAvailabilityByEntity(entityType, entityId, date);
  
  if (!availability) {
    throw new Error('Availability record not found');
  }

  const updatedSlots = availability.timeSlots.map(slot => {
    // Check if this slot is within the blocked time range
    if (slot.startTime >= startTime && slot.endTime <= endTime) {
      return {
        ...slot,
        isAvailable: false,
        reasonUnavailable: reason,
        customReason,
      };
    }
    return slot;
  });

  await availabilityRepo.updateAvailability(orgId, entityType, entityId, date, {
    timeSlots: updatedSlots,
  });
};

// Helper functions
const getDatesBetween = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

const getDayOfWeek = (date: string): keyof WeeklySchedule => {
  const dayIndex = new Date(date).getDay();
  const days: (keyof WeeklySchedule)[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];
  return days[dayIndex];
};

const generateTimeSlotsFromSchedule = (
  daySchedule: ResourceDaySchedule,
  slotDuration: number
): AvailabilitySlot[] => {
  const slots: AvailabilitySlot[] = [];
  
  const startMinutes = timeToMinutes(daySchedule.startTime);
  const endMinutes = timeToMinutes(daySchedule.endTime);
  
  for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += slotDuration) {
    const slotStart = minutesToTime(currentMinutes);
    const slotEnd = minutesToTime(Math.min(currentMinutes + slotDuration, endMinutes));
    
    // Check if this slot conflicts with any breaks
    const isBreak = daySchedule.breaks?.some(breakPeriod => {
      const breakStart = timeToMinutes(breakPeriod.startTime);
      const breakEnd = timeToMinutes(breakPeriod.endTime);
      return currentMinutes < breakEnd && (currentMinutes + slotDuration) > breakStart;
    });
    
    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      isAvailable: !isBreak,
      reasonUnavailable: isBreak ? 'break' : undefined,
    });
  }
  
  return slots;
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const addMinutesToTime = (time: string, minutes: number): string => {
  const totalMinutes = timeToMinutes(time) + minutes;
  return minutesToTime(totalMinutes);
};

const getEntityName = async (
  orgId: string,
  entityType: 'staff' | 'resource',
  entityId: string
): Promise<string> => {
  if (entityType === 'staff') {
    const staff = await staffRepo.getStaffById(orgId, entityId);
    return staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown Staff';
  } else {
    const resource = await resourceRepo.getResourceById(orgId, entityId);
    return resource ? resource.name : 'Unknown Resource';
  }
};