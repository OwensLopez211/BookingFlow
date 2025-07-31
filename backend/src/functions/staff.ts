import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import * as staffRepo from '../repositories/staffRepository';
import * as availabilityService from '../services/availabilityService';

export const createStaff = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const staffData = JSON.parse(event.body || '{}');
    const staff = await staffRepo.createStaff({
      orgId: user.orgId,
      ...staffData,
    });

    return createResponse(201, { 
      message: 'Staff member created successfully',
      data: staff 
    });
  } catch (error: any) {
    console.error('Create staff error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const getStaff = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const staffId = event.pathParameters?.id;
    if (!staffId) {
      return createResponse(400, { error: 'Staff ID is required' });
    }

    const staff = await staffRepo.getStaffById(user.orgId, staffId);
    if (!staff) {
      return createResponse(404, { error: 'Staff member not found' });
    }

    return createResponse(200, { data: staff });
  } catch (error: any) {
    console.error('Get staff error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const getAllStaff = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const queryParams = event.queryStringParameters || {};
    const { activeOnly, role, specialty } = queryParams;

    let staff;
    if (role) {
      staff = await staffRepo.getStaffByRole(user.orgId, role, activeOnly === 'true');
    } else if (specialty) {
      staff = await staffRepo.getStaffBySpecialty(user.orgId, specialty);
    } else {
      staff = await staffRepo.getStaffByOrgId(user.orgId, activeOnly === 'true');
    }

    return createResponse(200, { 
      data: staff,
      total: staff.length 
    });
  } catch (error: any) {
    console.error('Get all staff error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const updateStaff = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const staffId = event.pathParameters?.id;
    if (!staffId) {
      return createResponse(400, { error: 'Staff ID is required' });
    }

    const updates = JSON.parse(event.body || '{}');
    const staff = await staffRepo.updateStaff(user.orgId, staffId, updates);

    return createResponse(200, { 
      message: 'Staff member updated successfully',
      data: staff 
    });
  } catch (error: any) {
    console.error('Update staff error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const deleteStaff = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const staffId = event.pathParameters?.id;
    if (!staffId) {
      return createResponse(400, { error: 'Staff ID is required' });
    }

    await staffRepo.deleteStaff(user.orgId, staffId);

    return createResponse(200, { message: 'Staff member deleted successfully' });
  } catch (error: any) {
    console.error('Delete staff error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const activateStaff = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const staffId = event.pathParameters?.id;
    if (!staffId) {
      return createResponse(400, { error: 'Staff ID is required' });
    }

    const staff = await staffRepo.activateStaff(user.orgId, staffId);

    return createResponse(200, { 
      message: 'Staff member activated successfully',
      data: staff 
    });
  } catch (error: any) {
    console.error('Activate staff error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const deactivateStaff = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const staffId = event.pathParameters?.id;
    if (!staffId) {
      return createResponse(400, { error: 'Staff ID is required' });
    }

    const staff = await staffRepo.deactivateStaff(user.orgId, staffId);

    return createResponse(200, { 
      message: 'Staff member deactivated successfully',
      data: staff 
    });
  } catch (error: any) {
    console.error('Deactivate staff error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const getStaffAvailability = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const staffId = event.pathParameters?.id;
    if (!staffId) {
      return createResponse(400, { error: 'Staff ID is required' });
    }

    const queryParams = event.queryStringParameters || {};
    const { startDate, endDate } = queryParams;

    if (!startDate || !endDate) {
      return createResponse(400, { error: 'Start date and end date are required' });
    }

    const availability = await availabilityService.getEntityAvailability(
      user.orgId,
      'staff',
      staffId,
      startDate,
      endDate
    );

    return createResponse(200, { data: availability });
  } catch (error: any) {
    console.error('Get staff availability error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const generateStaffAvailability = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const staffId = event.pathParameters?.id;
    if (!staffId) {
      return createResponse(400, { error: 'Staff ID is required' });
    }

    const { startDate, endDate, slotDuration = 30, override = false } = JSON.parse(event.body || '{}');

    if (!startDate || !endDate) {
      return createResponse(400, { error: 'Start date and end date are required' });
    }

    await availabilityService.generateAvailabilityForStaff(user.orgId, staffId, {
      startDate,
      endDate,
      slotDuration,
      override,
    });

    return createResponse(200, { message: 'Staff availability generated successfully' });
  } catch (error: any) {
    console.error('Generate staff availability error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const getAvailableStaff = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const queryParams = event.queryStringParameters || {};
    const { date, duration, specialty } = queryParams;

    if (!date || !duration) {
      return createResponse(400, { error: 'Date and duration are required' });
    }

    const requiredSpecialties = specialty ? specialty.split(',') : [];
    
    const availableSlots = await availabilityService.findAvailableSlots(
      user.orgId,
      date,
      parseInt(duration),
      'staff',
      undefined,
      requiredSpecialties
    );

    return createResponse(200, { data: availableSlots });
  } catch (error: any) {
    console.error('Get available staff error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};