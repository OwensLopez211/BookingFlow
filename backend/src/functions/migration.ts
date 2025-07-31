import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import * as migrationService from '../services/migrationService';

export const migrateOrganization = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const result = await migrationService.migrateOrganizationToFlexibleSystem(user.orgId);

    if (result.success) {
      return createResponse(200, {
        message: result.message,
        data: result.details,
      });
    } else {
      return createResponse(400, {
        error: result.message,
        details: result.details,
      });
    }
  } catch (error: any) {
    console.error('Migration error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const validateMigration = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const result = await migrationService.validateMigration(user.orgId);

    return createResponse(200, {
      message: result.message,
      success: result.success,
      data: result.details,
    });
  } catch (error: any) {
    console.error('Validation error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

export const getCompatibilityReport = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const user = await authMiddleware(event);
    if (!user.orgId) {
      return createResponse(403, { error: 'Organization access required' });
    }

    const report = await migrationService.getCompatibilityReport(user.orgId);

    return createResponse(200, { data: report });
  } catch (error: any) {
    console.error('Compatibility report error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};