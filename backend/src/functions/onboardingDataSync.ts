import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../utils/response';
import { verifyToken } from '../utils/cognito';
import { getUserByCognitoId } from '../repositories/userRepository';
import { OnboardingDataSyncService } from '../services/onboardingDataSyncService';

/**
 * Endpoint para forzar sincronización manual de datos del onboarding
 */
export const forceDataSync = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    // Solo permitir a owners forzar sincronización
    if (user.role !== 'owner') {
      return createResponse(403, { error: 'Only owners can force data synchronization' });
    }

    const result = await OnboardingDataSyncService.syncAllOnboardingData(decoded.username);

    return createResponse(200, {
      message: 'Data synchronization completed',
      syncResult: result
    });

  } catch (error) {
    console.error('Error forcing data sync:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

/**
 * Endpoint para verificar el estado de sincronización de datos
 */
export const checkDataSyncStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    const syncStatus = await OnboardingDataSyncService.verifyDataSync(decoded.username);

    return createResponse(200, {
      syncStatus,
      recommendations: generateSyncRecommendations(syncStatus)
    });

  } catch (error) {
    console.error('Error checking data sync status:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

/**
 * Endpoint para sincronizar un step específico
 */
export const syncSpecificStep = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const { stepNumber } = JSON.parse(event.body);
    
    if (!stepNumber || stepNumber < 1 || stepNumber > 5) {
      return createResponse(400, { error: 'Valid stepNumber (1-5) is required' });
    }

    // Encontrar los datos del step
    const completedStep = user.onboardingStatus?.completedSteps?.find(
      (step: any) => step.stepNumber === stepNumber
    );

    if (!completedStep) {
      return createResponse(404, { error: `Step ${stepNumber} not found or not completed` });
    }

    // Sincronizar solo este step
    await OnboardingDataSyncService.syncStepData(
      user.orgId,
      stepNumber,
      completedStep.data,
      decoded.username
    );

    return createResponse(200, {
      message: `Step ${stepNumber} synchronized successfully`
    });

  } catch (error) {
    console.error('Error syncing specific step:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// Función auxiliar para generar recomendaciones
const generateSyncRecommendations = (syncStatus: any): string[] => {
  const recommendations: string[] = [];

  if (!syncStatus.isSynced) {
    recommendations.push('Your onboarding data is not fully synchronized');
    
    if (syncStatus.missingData.length > 0) {
      recommendations.push(`Missing data: ${syncStatus.missingData.join(', ')}`);
      recommendations.push('Consider running a manual sync to fix missing data');
    }

    if (syncStatus.inconsistencies.length > 0) {
      recommendations.push(`Data inconsistencies found: ${syncStatus.inconsistencies.join(', ')}`);
      recommendations.push('Review your onboarding data and run a manual sync');
    }
  } else {
    recommendations.push('All onboarding data is properly synchronized');
  }

  return recommendations;
};