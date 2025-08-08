import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, deleteItem, TABLES, dynamoClient } from '../utils/dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Appointment } from '../../../shared/types/business';

export const createAppointment = async (
  appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Appointment> => {
  const appointment: Appointment = {
    id: uuidv4(),
    ...appointmentData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const item = {
    PK: `ORG#${appointment.orgId}`,
    SK: `APPOINTMENT#${appointment.id}`,
    GSI1PK: `ORG#${appointment.orgId}`,
    GSI1SK: `DATE#${appointment.datetime.split('T')[0]}`, // YYYY-MM-DD
    GSI2PK: appointment.staffId ? `STAFF#${appointment.staffId}` : 'NO_STAFF',
    GSI2SK: `DATE#${appointment.datetime.split('T')[0]}`,
    ...appointment,
  };

  await putItem(TABLES.ORGANIZATIONS, item);
  return appointment;
};

export const getAppointmentById = async (orgId: string, appointmentId: string): Promise<Appointment | null> => {
  const item = await getItem(TABLES.ORGANIZATIONS, {
    PK: `ORG#${orgId}`,
    SK: `APPOINTMENT#${appointmentId}`,
  });

  if (!item) return null;

  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...appointment } = item;
  return appointment as Appointment;
};

export const getAppointmentsByOrgAndDate = async (
  orgId: string, 
  date: string
): Promise<Appointment[]> => {
  const command = new QueryCommand({
    TableName: TABLES.ORGANIZATIONS,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
    ExpressionAttributeValues: {
      ':pk': `ORG#${orgId}`,
      ':sk': `DATE#${date}`,
    },
  });

  const result = await dynamoClient.send(command);

  if (!result.Items) return [];

  return result.Items.map(item => {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...appointment } = item;
    return appointment as Appointment;
  });
};

export const getAppointmentsByOrgAndDateRange = async (
  orgId: string, 
  startDate: string, 
  endDate: string
): Promise<Appointment[]> => {
  const command = new QueryCommand({
    TableName: TABLES.ORGANIZATIONS,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK BETWEEN :start AND :end',
    ExpressionAttributeValues: {
      ':pk': `ORG#${orgId}`,
      ':start': `DATE#${startDate}`,
      ':end': `DATE#${endDate}`,
    },
  });

  const result = await dynamoClient.send(command);

  if (!result.Items) return [];

  return result.Items.map(item => {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...appointment } = item;
    return appointment as Appointment;
  });
};

export const getAppointmentsByStaffAndDate = async (
  staffId: string, 
  date: string
): Promise<Appointment[]> => {
  const command = new QueryCommand({
    TableName: TABLES.ORGANIZATIONS,
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK = :sk',
    ExpressionAttributeValues: {
      ':pk': `STAFF#${staffId}`,
      ':sk': `DATE#${date}`,
    },
  });

  const result = await dynamoClient.send(command);

  if (!result.Items) return [];

  return result.Items.map(item => {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...appointment } = item;
    return appointment as Appointment;
  });
};

export const getAppointmentsByStaffAndDateRange = async (
  staffId: string, 
  startDate: string, 
  endDate: string
): Promise<Appointment[]> => {
  const command = new QueryCommand({
    TableName: TABLES.ORGANIZATIONS,
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK BETWEEN :start AND :end',
    ExpressionAttributeValues: {
      ':pk': `STAFF#${staffId}`,
      ':start': `DATE#${startDate}`,
      ':end': `DATE#${endDate}`,
    },
  });

  const result = await dynamoClient.send(command);

  if (!result.Items) return [];

  return result.Items.map(item => {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...appointment } = item;
    return appointment as Appointment;
  });
};

export const getAppointmentsByResource = async (
  orgId: string,
  resourceId: string, 
  startDate: string, 
  endDate: string
): Promise<Appointment[]> => {
  // Since we don't have a direct GSI for resource, we need to query by org and filter
  const appointments = await getAppointmentsByOrgAndDateRange(orgId, startDate, endDate);
  return appointments.filter(appointment => appointment.resourceId === resourceId);
};

export const updateAppointment = async (
  orgId: string, 
  appointmentId: string, 
  updates: Partial<Appointment>
): Promise<Appointment> => {
  const currentAppointment = await getAppointmentById(orgId, appointmentId);
  if (!currentAppointment) {
    throw new Error('Appointment not found');
  }

  const updatedAppointment = {
    ...currentAppointment,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const item = {
    PK: `ORG#${orgId}`,
    SK: `APPOINTMENT#${appointmentId}`,
    GSI1PK: `ORG#${orgId}`,
    GSI1SK: `DATE#${updatedAppointment.datetime.split('T')[0]}`,
    GSI2PK: updatedAppointment.staffId ? `STAFF#${updatedAppointment.staffId}` : 'NO_STAFF',
    GSI2SK: `DATE#${updatedAppointment.datetime.split('T')[0]}`,
    ...updatedAppointment,
  };

  await putItem(TABLES.ORGANIZATIONS, item);
  
  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...appointment } = item;
  return appointment as Appointment;
};

export const cancelAppointment = async (
  orgId: string, 
  appointmentId: string, 
  cancelledBy: 'client' | 'staff' | 'admin',
  reason?: string,
  penaltyApplied?: number
): Promise<Appointment> => {
  return updateAppointment(orgId, appointmentId, {
    status: 'cancelled',
    cancellationInfo: {
      cancelledAt: new Date().toISOString(),
      cancelledBy,
      reason,
      penaltyApplied,
    },
  });
};

export const rescheduleAppointment = async (
  orgId: string, 
  appointmentId: string, 
  newDatetime: string,
  rescheduledBy: string,
  reason?: string
): Promise<Appointment> => {
  const currentAppointment = await getAppointmentById(orgId, appointmentId);
  if (!currentAppointment) {
    throw new Error('Appointment not found');
  }

  const reschedulingRecord = {
    previousDatetime: currentAppointment.datetime,
    newDatetime,
    rescheduledAt: new Date().toISOString(),
    rescheduledBy,
    reason,
  };

  return updateAppointment(orgId, appointmentId, {
    status: 'rescheduled',
    datetime: newDatetime,
    reschedulingHistory: [
      ...(currentAppointment.reschedulingHistory || []),
      reschedulingRecord,
    ],
  });
};

export const confirmAppointment = async (orgId: string, appointmentId: string): Promise<Appointment> => {
  return updateAppointment(orgId, appointmentId, { status: 'confirmed' });
};

export const completeAppointment = async (orgId: string, appointmentId: string): Promise<Appointment> => {
  return updateAppointment(orgId, appointmentId, { status: 'completed' });
};

export const markNoShow = async (orgId: string, appointmentId: string): Promise<Appointment> => {
  return updateAppointment(orgId, appointmentId, { status: 'no_show' });
};

export const deleteAppointment = async (orgId: string, appointmentId: string): Promise<void> => {
  await deleteItem(TABLES.ORGANIZATIONS, {
    PK: `ORG#${orgId}`,
    SK: `APPOINTMENT#${appointmentId}`,
  });
};

export const getAppointmentStats = async (
  orgId: string, 
  startDate: string, 
  endDate: string
): Promise<{
  total: number;
  confirmed: number;
  pending: number;
  completed: number;
  cancelled: number;
  noShow: number;
}> => {
  const appointments = await getAppointmentsByOrgAndDateRange(orgId, startDate, endDate);
  
  const stats = {
    total: appointments.length,
    confirmed: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
  };

  appointments.forEach(appointment => {
    switch (appointment.status) {
      case 'confirmed':
        stats.confirmed++;
        break;
      case 'pending':
        stats.pending++;
        break;
      case 'completed':
        stats.completed++;
        break;
      case 'cancelled':
        stats.cancelled++;
        break;
      case 'no_show':
        stats.noShow++;
        break;
    }
  });

  return stats;
};