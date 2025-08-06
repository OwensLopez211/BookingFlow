"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateCosts = exports.withMetrics = exports.getRequestStats = void 0;
/**
 * Simple in-memory storage for development
 * In production, you'd use CloudWatch or DynamoDB
 */
const requestMetrics = [];
/**
 * Log request metrics
 */
const logMetrics = (metrics) => {
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
const getRequestStats = () => {
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
        }, {}),
        statusCodes: requestMetrics.reduce((acc, r) => {
            acc[r.statusCode] = (acc[r.statusCode] || 0) + 1;
            return acc;
        }, {})
    };
};
exports.getRequestStats = getRequestStats;
/**
 * Middleware to track request metrics
 */
const withMetrics = (handler, options) => {
    return async (event) => {
        const startTime = Date.now();
        try {
            const result = await handler(event);
            const duration = Date.now() - startTime;
            const metrics = {
                timestamp: new Date().toISOString(),
                method: event.httpMethod,
                path: event.path,
                statusCode: result.statusCode,
                duration,
                userAgent: event.headers['User-Agent'] || event.headers['user-agent'],
                ipAddress: event.requestContext?.identity?.sourceIp
            };
            // Add user ID if available and tracking is enabled
            if (options?.trackUser && event.user?.id) {
                metrics.userId = event.user.id;
            }
            logMetrics(metrics);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const metrics = {
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
exports.withMetrics = withMetrics;
/**
 * Cost estimation based on AWS Lambda pricing
 * Prices as of 2024 (update accordingly)
 */
const estimateCosts = () => {
    const stats = (0, exports.getRequestStats)();
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
exports.estimateCosts = estimateCosts;
