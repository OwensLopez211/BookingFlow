import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import * as appointmentService from '../services/appointmentService';
import * as appointmentRepo from '../repositories/appointmentRepository';

export const createAppointment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const requestBody = JSON.parse(event.body || '{}');
    const appointment = await appointmentService.createAppointment({
      orgId: user.orgId,
      ...requestBody,
    });

    return createResponse(201, { 
      message: 'Appointment created successfully',
      data: appointment 
    });
  } catch (error: any) {
    console.error('Create appointment error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const getAppointment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const appointmentId = event.pathParameters?.id;
    if (!appointmentId) {
      return createResponse(400, { error: 'Appointment ID is required' });
    }

    const appointment = await appointmentRepo.getAppointmentById(user.orgId, appointmentId);
    if (!appointment) {
      return createResponse(404, { error: 'Appointment not found' });
    }

    return createResponse(200, { data: appointment });
  } catch (error: any) {
    console.error('Get appointment error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const updateAppointment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const appointmentId = event.pathParameters?.id;
    if (!appointmentId) {
      return createResponse(400, { error: 'Appointment ID is required' });
    }

    const updates = JSON.parse(event.body || '{}');
    const appointment = await appointmentService.updateAppointment(user.orgId, appointmentId, updates);

    return createResponse(200, { 
      message: 'Appointment updated successfully',
      data: appointment 
    });
  } catch (error: any) {
    console.error('Update appointment error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const cancelAppointment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const appointmentId = event.pathParameters?.id;
    if (!appointmentId) {
      return createResponse(400, { error: 'Appointment ID is required' });
    }

    const { reason } = JSON.parse(event.body || '{}');
    const appointment = await appointmentService.cancelAppointment(
      user.orgId, 
      appointmentId, 
      'admin', // TODO: Determine cancellation source based on user role
      reason
    );

    return createResponse(200, { 
      message: 'Appointment cancelled successfully',
      data: appointment 
    });
  } catch (error: any) {
    console.error('Cancel appointment error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const rescheduleAppointment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const appointmentId = event.pathParameters?.id;
    if (!appointmentId) {
      return createResponse(400, { error: 'Appointment ID is required' });
    }

    const { newDatetime, reason } = JSON.parse(event.body || '{}');
    if (!newDatetime) {
      return createResponse(400, { error: 'New datetime is required' });
    }

    const appointment = await appointmentService.rescheduleAppointment(
      user.orgId, 
      appointmentId, 
      newDatetime,
      user.id,
      reason
    );

    return createResponse(200, { 
      message: 'Appointment rescheduled successfully',
      data: appointment 
    });
  } catch (error: any) {
    console.error('Reschedule appointment error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const getAppointments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const queryParams = event.queryStringParameters || {};
    const { startDate, endDate, staffId, resourceId, status } = queryParams;

    if (!startDate || !endDate) {
      return createResponse(400, { error: 'Start date and end date are required' });
    }

    let appointments = await appointmentService.getAppointmentsByDateRange(
      user.orgId, 
      startDate, 
      endDate, 
      staffId, 
      resourceId
    );

    // Filter by status if provided
    if (status) {
      appointments = appointments.filter(apt => apt.status === status);
    }

    return createResponse(200, { 
      data: appointments,
      total: appointments.length 
    });
  } catch (error: any) {
    console.error('Get appointments error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const getAppointmentStats = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const queryParams = event.queryStringParameters || {};
    const { startDate, endDate } = queryParams;

    if (!startDate || !endDate) {
      return createResponse(400, { error: 'Start date and end date are required' });
    }

    const stats = await appointmentRepo.getAppointmentStats(user.orgId, startDate, endDate);

    return createResponse(200, { data: stats });
  } catch (error: any) {
    console.error('Get appointment stats error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const confirmAppointment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const appointmentId = event.pathParameters?.id;
    if (!appointmentId) {
      return createResponse(400, { error: 'Appointment ID is required' });
    }

    const appointment = await appointmentRepo.confirmAppointment(user.orgId, appointmentId);

    return createResponse(200, { 
      message: 'Appointment confirmed successfully',
      data: appointment 
    });
  } catch (error: any) {
    console.error('Confirm appointment error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const completeAppointment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const appointmentId = event.pathParameters?.id;
    if (!appointmentId) {
      return createResponse(400, { error: 'Appointment ID is required' });
    }

    const appointment = await appointmentRepo.completeAppointment(user.orgId, appointmentId);

    return createResponse(200, { 
      message: 'Appointment completed successfully',
      data: appointment 
    });
  } catch (error: any) {
    console.error('Complete appointment error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const markNoShow = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const appointmentId = event.pathParameters?.id;
    if (!appointmentId) {
      return createResponse(400, { error: 'Appointment ID is required' });
    }

    const appointment = await appointmentRepo.markNoShow(user.orgId, appointmentId);

    return createResponse(200, { 
      message: 'Appointment marked as no-show',
      data: appointment 
    });
  } catch (error: any) {
    console.error('Mark no-show error:', error);
    return createResponse(400, { error: error.message });
  }
};

export const debugAllAppointments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const queryParams = event.queryStringParameters || {};
    const limit = queryParams.limit ? parseInt(queryParams.limit) : 50;
    
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    const appointments = await appointmentRepo.getAppointmentsByOrgAndDateRange(
      user.orgId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const limitedAppointments = appointments.slice(0, limit);

    return createResponse(200, {
      message: `Debug: Found ${appointments.length} total appointments`,
      data: {
        totalCount: appointments.length,
        returnedCount: limitedAppointments.length,
        appointments: limitedAppointments,
        queryInfo: {
          orgId: user.orgId,
          dateRange: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          },
          limit
        }
      }
    });
  } catch (error: any) {
    console.error('Debug appointments error:', error);
    return createResponse(500, { error: error.message });
  }
};