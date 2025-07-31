import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import * as resourceRepo from '../repositories/resourceRepository';
import * as availabilityService from '../services/availabilityService';

export const createResource = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const resourceData = JSON.parse(event.body || '{}');
    const resource = await resourceRepo.createResource({
      orgId: user.orgId,
      ...resourceData,
    });

    return createResponse(201, { 
      message: 'Resource created successfully',
      data: resource 
    });
  } catch (error: any) {
    console.error('Create resource error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const getResource = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const resourceId = event.pathParameters?.id;
    if (!resourceId) {
      return createResponse(400, { error: 'Resource ID is required' });
    }

    const resource = await resourceRepo.getResourceById(user.orgId, resourceId);
    if (!resource) {
      return createResponse(404, { error: 'Resource not found' });
    }

    return createResponse(200, { data: resource });
  } catch (error: any) {
    console.error('Get resource error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const getAllResources = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const queryParams = event.queryStringParameters || {};
    const { activeOnly, type } = queryParams;

    let resources;
    if (type) {
      resources = await resourceRepo.getResourcesByType(user.orgId, type as any, activeOnly === 'true');
    } else {
      resources = await resourceRepo.getResourcesByOrgId(user.orgId, activeOnly === 'true');
    }

    return createResponse(200, { 
      data: resources,
      total: resources.length 
    });
  } catch (error: any) {
    console.error('Get all resources error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const updateResource = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const resourceId = event.pathParameters?.id;
    if (!resourceId) {
      return createResponse(400, { error: 'Resource ID is required' });
    }

    const updates = JSON.parse(event.body || '{}');
    const resource = await resourceRepo.updateResource(user.orgId, resourceId, updates);

    return createResponse(200, { 
      message: 'Resource updated successfully',
      data: resource 
    });
  } catch (error: any) {
    console.error('Update resource error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const deleteResource = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const resourceId = event.pathParameters?.id;
    if (!resourceId) {
      return createResponse(400, { error: 'Resource ID is required' });
    }

    await resourceRepo.deleteResource(user.orgId, resourceId);

    return createResponse(200, { message: 'Resource deleted successfully' });
  } catch (error: any) {
    console.error('Delete resource error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const activateResource = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const resourceId = event.pathParameters?.id;
    if (!resourceId) {
      return createResponse(400, { error: 'Resource ID is required' });
    }

    const resource = await resourceRepo.activateResource(user.orgId, resourceId);

    return createResponse(200, { 
      message: 'Resource activated successfully',
      data: resource 
    });
  } catch (error: any) {
    console.error('Activate resource error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const deactivateResource = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const resourceId = event.pathParameters?.id;
    if (!resourceId) {
      return createResponse(400, { error: 'Resource ID is required' });
    }

    const resource = await resourceRepo.deactivateResource(user.orgId, resourceId);

    return createResponse(200, { 
      message: 'Resource deactivated successfully',
      data: resource 
    });
  } catch (error: any) {
    console.error('Deactivate resource error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const getResourceAvailability = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const resourceId = event.pathParameters?.id;
    if (!resourceId) {
      return createResponse(400, { error: 'Resource ID is required' });
    }

    const queryParams = event.queryStringParameters || {};
    const { startDate, endDate } = queryParams;

    if (!startDate || !endDate) {
      return createResponse(400, { error: 'Start date and end date are required' });
    }

    const availability = await availabilityService.getEntityAvailability(
      user.orgId,
      'resource',
      resourceId,
      startDate,
      endDate
    );

    return createResponse(200, { data: availability });
  } catch (error: any) {
    console.error('Get resource availability error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const generateResourceAvailability = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const resourceId = event.pathParameters?.id;
    if (!resourceId) {
      return createResponse(400, { error: 'Resource ID is required' });
    }

    const { startDate, endDate, slotDuration = 30, override = false } = JSON.parse(event.body || '{}');

    if (!startDate || !endDate) {
      return createResponse(400, { error: 'Start date and end date are required' });
    }

    await availabilityService.generateAvailabilityForResource(user.orgId, resourceId, {
      startDate,
      endDate,
      slotDuration,
      override,
    });

    return createResponse(200, { message: 'Resource availability generated successfully' });
  } catch (error: any) {
    console.error('Generate resource availability error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const getAvailableResources = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const queryParams = event.queryStringParameters || {};
    const { date, duration, type } = queryParams;

    if (!date || !duration) {
      return createResponse(400, { error: 'Date and duration are required' });
    }

    const availableSlots = await availabilityService.findAvailableSlots(
      user.orgId,
      date,
      parseInt(duration),
      'resource'
    );

    // Filter by type if specified
    let filteredSlots = availableSlots;
    if (type) {
      const resourcesOfType = await resourceRepo.getResourcesByType(user.orgId, type as any, true);
      const resourceIds = resourcesOfType.map(r => r.id);
      filteredSlots = availableSlots.filter(slot => resourceIds.includes(slot.entityId));
    }

    return createResponse(200, { data: filteredSlots });
  } catch (error: any) {
    console.error('Get available resources error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const blockResourceTime = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const resourceId = event.pathParameters?.id;
    if (!resourceId) {
      return createResponse(400, { error: 'Resource ID is required' });
    }

    const { date, startTime, endTime, reason, customReason } = JSON.parse(event.body || '{}');

    if (!date || !startTime || !endTime || !reason) {
      return createResponse(400, { error: 'Date, start time, end time, and reason are required' });
    }

    await availabilityService.blockTimeSlot(
      user.orgId,
      'resource',
      resourceId,
      date,
      startTime,
      endTime,
      reason,
      customReason
    );

    return createResponse(200, { message: 'Resource time blocked successfully' });
  } catch (error: any) {
    console.error('Block resource time error:', error);
    return createResponse(400, { error: error.message });
  }
};