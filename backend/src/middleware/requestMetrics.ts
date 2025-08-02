import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface RequestMetrics {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Simple in-memory storage for development
 * In production, you'd use CloudWatch or DynamoDB
 */
const requestMetrics: RequestMetrics[] = [];

/**
 * Log request metrics
 */
const logMetrics = (metrics: RequestMetrics) => {
  requestMetrics.push(metrics);
  
  // Log to console for development
  console.log('[METRICS]', JSON.stringify({
    timestamp: metrics.timestamp,
    method: metrics.method,
    path: metrics.path,
    statusCode: metrics.statusCode,
    duration: `${metrics.duration}ms`,
    userId: metrics.userId || 'anonymous'
  }));
  
  // Keep only last 1000 requests in memory
  if (requestMetrics.length > 1000) {
    requestMetrics.shift();
  }
};

/**
 * Get request statistics
 */
export const getRequestStats = () => {
  const now = new Date();
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
  const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentRequests = requestMetrics.filter(r => new Date(r.timestamp) > lastHour);
  const dailyRequests = requestMetrics.filter(r => new Date(r.timestamp) > lastDay);
  
  return {
    total: requestMetrics.length,
    lastHour: recentRequests.length,
    lastDay: dailyRequests.length,
    averageResponseTime: requestMetrics.length > 0 
      ? Math.round(requestMetrics.reduce((sum, r) => sum + r.duration, 0) / requestMetrics.length)
      : 0,
    endpoints: requestMetrics.reduce((acc, r) => {
      const key = `${r.method} ${r.path}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    statusCodes: requestMetrics.reduce((acc, r) => {
      acc[r.statusCode] = (acc[r.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>)
  };
};

/**
 * Middleware to track request metrics
 */
export const withMetrics = (
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>,
  options?: { trackUser?: boolean }
) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const startTime = Date.now();
    
    try {
      const result = await handler(event);
      const duration = Date.now() - startTime;
      
      const metrics: RequestMetrics = {
        timestamp: new Date().toISOString(),
        method: event.httpMethod,
        path: event.path,
        statusCode: result.statusCode,
        duration,
        userAgent: event.headers['User-Agent'] || event.headers['user-agent'],
        ipAddress: event.requestContext?.identity?.sourceIp
      };
      
      // Add user ID if available and tracking is enabled
      if (options?.trackUser && (event as any).user?.id) {
        metrics.userId = (event as any).user.id;
      }
      
      logMetrics(metrics);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const metrics: RequestMetrics = {
        timestamp: new Date().toISOString(),
        method: event.httpMethod,
        path: event.path,
        statusCode: 500,
        duration,
        userAgent: event.headers['User-Agent'] || event.headers['user-agent'],
        ipAddress: event.requestContext?.identity?.sourceIp
      };
      
      logMetrics(metrics);
      
      throw error;
    }
  };
};

/**
 * Cost estimation based on AWS Lambda pricing
 * Prices as of 2024 (update accordingly)
 */
export const estimateCosts = () => {
  const stats = getRequestStats();
  
  // AWS Lambda pricing (approximate)
  const LAMBDA_REQUEST_COST = 0.0000002; // $0.20 per 1M requests
  const LAMBDA_GB_SECOND_COST = 0.0000166667; // $16.67 per 1M GB-seconds
  
  // Assume average 512MB memory and 200ms duration
  const avgMemoryGB = 0.5;
  const avgDurationSeconds = 0.2;
  
  const requestCost = stats.total * LAMBDA_REQUEST_COST;
  const computeCost = stats.total * avgMemoryGB * avgDurationSeconds * LAMBDA_GB_SECOND_COST;
  
  return {
    totalRequests: stats.total,
    estimatedMonthlyCost: {
      requests: requestCost * 30, // Approximate monthly
      compute: computeCost * 30,
      total: (requestCost + computeCost) * 30
    },
    dailyProjection: {
      requests: stats.lastDay,
      estimatedDailyCost: (stats.lastDay * LAMBDA_REQUEST_COST) + 
                          (stats.lastDay * avgMemoryGB * avgDurationSeconds * LAMBDA_GB_SECOND_COST)
    }
  };
};