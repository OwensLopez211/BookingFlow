import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem, query, deleteItem, TABLES } from '../utils/dynamodb';
import { Resource } from '../../../shared/types/business';

export const createResource = async (
  resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Resource> => {
  const resource: Resource = {
    id: uuidv4(),
    ...resourceData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const item = {
    PK: `ORG#${resource.orgId}`,
    SK: `RESOURCE#${resource.id}`,
    GSI1PK: `ORG#${resource.orgId}`,
    GSI1SK: `RESOURCE#${resource.type}`,
    GSI2PK: `RESOURCE#${resource.id}`,
    GSI2SK: 'PROFILE',
    ...resource,
  };

  await putItem(TABLES.ORGANIZATIONS, item);
  return resource;
};

export const getResourceById = async (orgId: string, resourceId: string): Promise<Resource | null> => {
  const item = await getItem(TABLES.ORGANIZATIONS, {
    PK: `ORG#${orgId}`,
    SK: `RESOURCE#${resourceId}`,
  });

  if (!item) return null;

  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...resource } = item;
  return resource as Resource;
};

export const getResourcesByOrgId = async (orgId: string, activeOnly: boolean = false): Promise<Resource[]> => {
  const result = await query(TABLES.ORGANIZATIONS, {
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `ORG#${orgId}`,
      ':sk': 'RESOURCE#',
    },
  });

  if (!result.Items) return [];

  let resources = result.Items.map(item => {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...resourceData } = item;
    return resourceData as Resource;
  });

  if (activeOnly) {
    resources = resources.filter(r => r.isActive);
  }

  return resources;
};

export const getResourcesByType = async (
  orgId: string, 
  type: Resource['type'], 
  activeOnly: boolean = false
): Promise<Resource[]> => {
  const result = await query(TABLES.ORGANIZATIONS, {
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
    ExpressionAttributeValues: {
      ':pk': `ORG#${orgId}`,
      ':sk': `RESOURCE#${type}`,
    },
  });

  if (!result.Items) return [];

  let resources = result.Items.map(item => {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...resourceData } = item;
    return resourceData as Resource;
  });

  if (activeOnly) {
    resources = resources.filter(r => r.isActive);
  }

  return resources;
};

export const updateResource = async (
  orgId: string, 
  resourceId: string, 
  updates: Partial<Resource>
): Promise<Resource> => {
  const currentResource = await getResourceById(orgId, resourceId);
  if (!currentResource) {
    throw new Error('Resource not found');
  }

  const updatedResource = {
    ...currentResource,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const item = {
    PK: `ORG#${orgId}`,
    SK: `RESOURCE#${resourceId}`,
    GSI1PK: `ORG#${orgId}`,
    GSI1SK: `RESOURCE#${updatedResource.type}`,
    GSI2PK: `RESOURCE#${resourceId}`,
    GSI2SK: 'PROFILE',
    ...updatedResource,
  };

  await putItem(TABLES.ORGANIZATIONS, item);
  
  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...resource } = item;
  return resource as Resource;
};

export const deleteResource = async (orgId: string, resourceId: string): Promise<void> => {
  await deleteItem(TABLES.ORGANIZATIONS, {
    PK: `ORG#${orgId}`,
    SK: `RESOURCE#${resourceId}`,
  });
};

export const activateResource = async (orgId: string, resourceId: string): Promise<Resource> => {
  return updateResource(orgId, resourceId, { isActive: true });
};

export const deactivateResource = async (orgId: string, resourceId: string): Promise<Resource> => {
  return updateResource(orgId, resourceId, { isActive: false });
};

export const getAvailableResources = async (
  orgId: string, 
  datetime: string, 
  duration: number,
  type?: Resource['type']
): Promise<Resource[]> => {
  let resources = type 
    ? await getResourcesByType(orgId, type, true)
    : await getResourcesByOrgId(orgId, true);

  // TODO: Add availability checking logic here
  // This would require checking against the Availability entity and existing appointments
  
  return resources;
};

export const getResourcesRequiringStaff = async (
  orgId: string, 
  staffRole?: string
): Promise<Resource[]> => {
  const resources = await getResourcesByOrgId(orgId, true);
  
  return resources.filter(resource => {
    if (!resource.staffRequirements) return false;
    
    if (staffRole) {
      return resource.staffRequirements.allowedRoles.includes(staffRole);
    }
    
    return resource.staffRequirements.requiredStaff > 0;
  });
};