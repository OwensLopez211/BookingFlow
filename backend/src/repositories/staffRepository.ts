import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, query, scan, deleteItem, TABLES } from '../utils/dynamodb';
import { Staff } from '../../../shared/types/business';

export const createStaff = async (
  staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Staff> => {
  const staff: Staff = {
    id: uuidv4(),
    ...staffData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const item = {
    PK: `ORG#${staff.orgId}`,
    SK: `STAFF#${staff.id}`,
    GSI1PK: `ORG#${staff.orgId}`,
    GSI1SK: `STAFF#${staff.role}`,
    GSI2PK: `STAFF#${staff.id}`,
    GSI2SK: 'PROFILE',
    ...staff,
  };

  await putItem(TABLES.ORGANIZATIONS, item);
  return staff;
};

export const getStaffById = async (orgId: string, staffId: string): Promise<Staff | null> => {
  const item = await getItem(TABLES.ORGANIZATIONS, {
    PK: `ORG#${orgId}`,
    SK: `STAFF#${staffId}`,
  });

  if (!item) return null;

  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...staff } = item;
  return staff as Staff;
};

export const getStaffByOrgId = async (orgId: string, activeOnly: boolean = false): Promise<Staff[]> => {
  const result = await query(TABLES.ORGANIZATIONS, {
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `ORG#${orgId}`,
      ':sk': 'STAFF#',
    },
  });

  if (!result.Items) return [];

  let staff = result.Items.map(item => {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...staffData } = item;
    return staffData as Staff;
  });

  if (activeOnly) {
    staff = staff.filter(s => s.isActive);
  }

  return staff;
};

export const getStaffByRole = async (orgId: string, role: string, activeOnly: boolean = false): Promise<Staff[]> => {
  const result = await query(TABLES.ORGANIZATIONS, {
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
    ExpressionAttributeValues: {
      ':pk': `ORG#${orgId}`,
      ':sk': `STAFF#${role}`,
    },
  });

  if (!result.Items) return [];

  let staff = result.Items.map(item => {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...staffData } = item;
    return staffData as Staff;
  });

  if (activeOnly) {
    staff = staff.filter(s => s.isActive);
  }

  return staff;
};

export const getStaffBySpecialty = async (orgId: string, specialty: string): Promise<Staff[]> => {
  const allStaff = await getStaffByOrgId(orgId, true);
  return allStaff.filter(staff => staff.specialties.includes(specialty));
};

export const updateStaff = async (
  orgId: string, 
  staffId: string, 
  updates: Partial<Staff>
): Promise<Staff> => {
  const currentStaff = await getStaffById(orgId, staffId);
  if (!currentStaff) {
    throw new Error('Staff member not found');
  }

  const updatedStaff = {
    ...currentStaff,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const item = {
    PK: `ORG#${orgId}`,
    SK: `STAFF#${staffId}`,
    GSI1PK: `ORG#${orgId}`,
    GSI1SK: `STAFF#${updatedStaff.role}`,
    GSI2PK: `STAFF#${staffId}`,
    GSI2SK: 'PROFILE',
    ...updatedStaff,
  };

  await putItem(TABLES.ORGANIZATIONS, item);
  
  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...staff } = item;
  return staff as Staff;
};

export const deleteStaff = async (orgId: string, staffId: string): Promise<void> => {
  await deleteItem(TABLES.ORGANIZATIONS, {
    PK: `ORG#${orgId}`,
    SK: `STAFF#${staffId}`,
  });
};

export const activateStaff = async (orgId: string, staffId: string): Promise<Staff> => {
  return updateStaff(orgId, staffId, { isActive: true });
};

export const deactivateStaff = async (orgId: string, staffId: string): Promise<Staff> => {
  return updateStaff(orgId, staffId, { isActive: false });
};

export const getAvailableStaff = async (
  orgId: string, 
  datetime: string, 
  duration: number,
  requiredSpecialties: string[] = []
): Promise<Staff[]> => {
  let staff = await getStaffByOrgId(orgId, true);
  
  // Filter by specialties if required
  if (requiredSpecialties.length > 0) {
    staff = staff.filter(s => 
      requiredSpecialties.some(specialty => s.specialties.includes(specialty))
    );
  }

  // TODO: Add availability checking logic here
  // This would require checking against the Availability entity and existing appointments
  
  return staff;
};