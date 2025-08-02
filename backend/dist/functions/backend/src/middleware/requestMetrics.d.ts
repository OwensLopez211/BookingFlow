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
 * Get request statistics
 */
export declare const getRequestStats: () => {
    total: number;
    lastHour: number;
    lastDay: number;
    averageResponseTime: number;
    endpoints: Record<string, number>;
    statusCodes: Record<number, number>;
};
/**
 * Middleware to track request metrics
 */
export declare const withMetrics: (handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>, options?: {
    trackUser?: boolean;
}) => (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
/**
 * Cost estimation based on AWS Lambda pricing
 * Prices as of 2024 (update accordingly)
 */
export declare const estimateCosts: () => {
    totalRequests: number;
    estimatedMonthlyCost: {
        requests: number;
        compute: number;
        total: number;
    };
    dailyProjection: {
        requests: number;
        estimatedDailyCost: number;
    };
};
