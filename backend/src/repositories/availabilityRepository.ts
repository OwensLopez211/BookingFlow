import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, query, batchWrite, TABLES } from '../utils/dynamodb';
import { Availability, AvailabilitySlot } from '../../../shared/types/business';

export const createAvailability = async (
  availabilityData: Omit<Availability, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Availability> => {
  const availability: Availability = {
    id: uuidv4(),
    ...availabilityData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const item = {
    PK: `ORG#${availability.orgId}`,
    SK: `AVAILABILITY#${availability.entityType}#${availability.entityId}#${availability.date}`,
    GSI1PK: `${availability.entityType.toUpperCase()}#${availability.entityId}`,
    GSI1SK: `DATE#${availability.date}`,
    GSI2PK: `ORG#${availability.orgId}`,
    GSI2SK: `AVAILABILITY#${availability.date}`,
    ...availability,
  };

  await putItem(TABLES.ORGANIZATIONS, item);
  return availability;
};

export const getAvailabilityById = async (orgId: string, availabilityId: string): Promise<Availability | null> => {
  const item = await getItem(TABLES.ORGANIZATIONS, {
    PK: `ORG#${orgId}`,
    SK: availabilityId,
  });

  if (!item) return null;

  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...availability } = item;
  return availability as Availability;
};

export const getAvailabilityByEntity = async (
  entityType: 'staff' | 'resource',
  entityId: string,
  date: string
): Promise<Availability | null> => {
  const result = await query(TABLES.ORGANIZATIONS, {
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
    ExpressionAttributeValues: {
      ':pk': `${entityType.toUpperCase()}#${entityId}`,
      ':sk': `DATE#${date}`,
    },
    Limit: 1,
  });

  if (!result.Items || result.Items.length === 0) return null;

  const item = result.Items[0];
  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...availability } = item;
  return availability as Availability;
};

export const getAvailabilityByEntityDateRange = async (
  entityType: 'staff' | 'resource',
  entityId: string,
  startDate: string,
  endDate: string
): Promise<Availability[]> => {
  const result = await query(TABLES.ORGANIZATIONS, {
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK BETWEEN :start AND :end',
    ExpressionAttributeValues: {
      ':pk': `${entityType.toUpperCase()}#${entityId}`,
      ':start': `DATE#${startDate}`,
      ':end': `DATE#${endDate}`,
    },
  });

  if (!result.Items) return [];

  return result.Items.map(item => {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...availability } = item;
    return availability as Availability;
  });
};

export const getAvailabilityByOrgAndDate = async (
  orgId: string,
  date: string
): Promise<Availability[]> => {
  const result = await query(TABLES.ORGANIZATIONS, {
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK = :sk',
    ExpressionAttributeValues: {
      ':pk': `ORG#${orgId}`,
      ':sk': `AVAILABILITY#${date}`,
    },
  });

  if (!result.Items) return [];

  return result.Items.map(item => {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...availability } = item;
    return availability as Availability;
  });
};

export const updateAvailability = async (
  orgId: string,
  entityType: 'staff' | 'resource',
  entityId: string,
  date: string,
  updates: Partial<Availability>
): Promise<Availability> => {
  const currentAvailability = await getAvailabilityByEntity(entityType, entityId, date);
  
  const updatedAvailability = {
    ...currentAvailability,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const item = {
    PK: `ORG#${orgId}`,
    SK: `AVAILABILITY#${entityType}#${entityId}#${date}`,
    GSI1PK: `${entityType.toUpperCase()}#${entityId}`,
    GSI1SK: `DATE#${date}`,
    GSI2PK: `ORG#${orgId}`,
    GSI2SK: `AVAILABILITY#${date}`,
    ...updatedAvailability,
  };

  await putItem(TABLES.ORGANIZATIONS, item);
  
  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...availability } = item;
  return availability as Availability;
};

export const bookTimeSlot = async (
  orgId: string,
  entityType: 'staff' | 'resource',
  entityId: string,
  date: string,
  startTime: string,
  endTime: string,
  appointmentId: string
): Promise<Availability> => {
  const availability = await getAvailabilityByEntity(entityType, entityId, date);
  
  if (!availability) {
    throw new Error('Availability record not found');
  }

  const updatedSlots = availability.timeSlots.map(slot => {
    // Check if this slot overlaps with the booking time
    if (slot.startTime >= startTime && slot.endTime <= endTime) {
      return {
        ...slot,
        isAvailable: false,
        bookedAppointmentId: appointmentId,
        reasonUnavailable: 'booked' as const,
      };
    }
    return slot;
  });

  return updateAvailability(orgId, entityType, entityId, date, {
    timeSlots: updatedSlots,
  });
};

export const releaseTimeSlot = async (
  orgId: string,
  entityType: 'staff' | 'resource',
  entityId: string,
  date: string,
  appointmentId: string
): Promise<Availability> => {
  const availability = await getAvailabilityByEntity(entityType, entityId, date);
  
  if (!availability) {
    throw new Error('Availability record not found');
  }

  const updatedSlots = availability.timeSlots.map(slot => {
    if (slot.bookedAppointmentId === appointmentId) {
      return {
        ...slot,
        isAvailable: true,
        bookedAppointmentId: undefined,
        reasonUnavailable: undefined,
        customReason: undefined,
      };
    }
    return slot;
  });

  return updateAvailability(orgId, entityType, entityId, date, {
    timeSlots: updatedSlots,
  });
};

export const getAvailableTimeSlots = async (
  entityType: 'staff' | 'resource',
  entityId: string,
  date: string,
  duration: number // in minutes
): Promise<AvailabilitySlot[]> => {
  const availability = await getAvailabilityByEntity(entityType, entityId, date);
  
  if (!availability || !availability.isActive) {
    return [];
  }

  return availability.timeSlots.filter(slot => 
    slot.isAvailable && 
    getSlotDurationMinutes(slot) >= duration
  );
};

export const findAvailableSlot = async (
  entityType: 'staff' | 'resource',
  entityId: string,
  date: string,
  duration: number,
  preferredStartTime?: string
): Promise<AvailabilitySlot | null> => {
  const availableSlots = await getAvailableTimeSlots(entityType, entityId, date, duration);
  
  if (availableSlots.length === 0) return null;

  // If preferred time is specified, try to find a slot that accommodates it
  if (preferredStartTime) {
    const preferredSlot = availableSlots.find(slot => 
      slot.startTime <= preferredStartTime && 
      slot.endTime >= addMinutesToTime(preferredStartTime, duration)
    );
    
    if (preferredSlot) return preferredSlot;
  }

  // Return the first available slot
  return availableSlots[0];
};

// Helper functions
const getSlotDurationMinutes = (slot: AvailabilitySlot): number => {
  const [startHour, startMinute] = slot.startTime.split(':').map(Number);
  const [endHour, endMinute] = slot.endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  return endTotalMinutes - startTotalMinutes;
};

const addMinutesToTime = (time: string, minutes: number): string => {
  const [hour, minute] = time.split(':').map(Number);
  const totalMinutes = hour * 60 + minute + minutes;
  
  const newHour = Math.floor(totalMinutes / 60);
  const newMinute = totalMinutes % 60;
  
  return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
};