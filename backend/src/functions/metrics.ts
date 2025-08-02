import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../utils/response';
import { getRequestStats, estimateCosts } from '../middleware/requestMetrics';
import { withAuth } from '../middleware/auth';

/**
 * Get request metrics and statistics
 */
const getMetricsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const stats = getRequestStats();
    const costs = estimateCosts();
    
    return successResponse({
      stats,
      costs,
      generatedAt: new Date().toISOString()
    }, 'Métricas obtenidas correctamente');
  } catch (error: any) {
    console.error('Error getting metrics:', error);
    return errorResponse('Error al obtener métricas');
  }
};

// Only allow owners/admins to see metrics
export const handler = withAuth(getMetricsHandler, { 
  requiredRoles: ['owner', 'admin'] 
});