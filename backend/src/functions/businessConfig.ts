import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../utils/response';
import { verifyToken } from '../utils/cognito';
import { getUserByCognitoId } from '../repositories/userRepository';
import { getBusinessConfigurationByOrgId } from '../repositories/businessConfigurationRepository';

export const getMyBusinessConfiguration = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return createResponse(401, { error: 'Token is required' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return createResponse(401, { error: 'Invalid token' });
    }

    const user = await getUserByCognitoId(decoded.username);
    if (!user) {
      return createResponse(404, { error: 'User not found' });
    }

    if (!user.orgId) {
      return createResponse(400, { error: 'User is not associated with an organization' });
    }

    const businessConfiguration = await getBusinessConfigurationByOrgId(user.orgId);
    
    if (!businessConfiguration) {
      return createResponse(404, { 
        error: 'Business configuration not found',
        message: 'Complete the onboarding process to create business configuration'
      });
    }

    return createResponse(200, {
      success: true,
      data: businessConfiguration,
      businessConfiguration
    });

  } catch (error) {
    console.error('Error getting business configuration:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};