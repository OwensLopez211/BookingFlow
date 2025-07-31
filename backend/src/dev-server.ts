import express from 'express';
import cors from 'cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler as authHandler } from './functions/auth';
import { handler as organizationsHandler } from './functions/organizations';
import { 
  getOnboardingStatus, 
  updateOnboardingStep, 
  resetOnboarding 
} from './functions/onboarding';

// Import local adapter to initialize mock services
import './utils/localAdapter';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock AWS environment variables for local development
process.env.STAGE = 'local';
process.env.USER_POOL_ID = 'local-user-pool';
process.env.USER_POOL_CLIENT_ID = 'local-client-id';
process.env.ORGANIZATIONS_TABLE = 'local-organizations';
process.env.USERS_TABLE = 'local-users';
process.env.APPOINTMENTS_TABLE = 'local-appointments';
process.env.REGION = 'us-east-1';

// Helper function to convert Express request to APIGatewayProxyEvent
const convertToAPIGatewayEvent = (req: any): APIGatewayProxyEvent => {
  const pathParameters: { [key: string]: string } = {};
  
  // Extract path parameters from route params
  Object.keys(req.params).forEach(key => {
    pathParameters[key] = req.params[key];
  });

  return {
    resource: req.route?.path || req.path,
    path: req.path,
    httpMethod: req.method,
    headers: req.headers,
    multiValueHeaders: {},
    queryStringParameters: req.query,
    multiValueQueryStringParameters: {},
    pathParameters: Object.keys(pathParameters).length > 0 ? pathParameters : null,
    stageVariables: null,
    requestContext: {
      resourceId: '',
      resourcePath: req.path,
      httpMethod: req.method,
      requestId: Math.random().toString(36).substring(7),
      path: req.path,
      accountId: 'local',
      apiId: 'local',
      stage: 'local',
      requestTime: new Date().toISOString(),
      requestTimeEpoch: Date.now(),
      authorizer: null,
      identity: {
        cognitoIdentityPoolId: null,
        accountId: null,
        cognitoIdentityId: null,
        caller: null,
        sourceIp: req.ip,
        principalOrgId: null,
        accessKey: null,
        cognitoAuthenticationType: null,
        cognitoAuthenticationProvider: null,
        userArn: null,
        userAgent: req.get('User-Agent') || '',
        user: null,
        apiKey: null,
        apiKeyId: null,
        clientCert: null,
      },
      protocol: 'HTTP/1.1',
      domainName: 'localhost',
      domainPrefix: 'localhost',
    },
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
  };
};

// Helper function to convert APIGatewayProxyResult to Express response
const sendAPIGatewayResponse = (res: any, result: APIGatewayProxyResult) => {
  // Set headers
  if (result.headers) {
    Object.keys(result.headers).forEach(key => {
      res.set(key, result.headers![key]);
    });
  }

  // Set status and send body
  res.status(result.statusCode).send(result.body);
};

// Middleware to handle Lambda functions
const handleLambdaFunction = (lambdaHandler: any) => {
  return async (req: any, res: any) => {
    try {
      console.log(`🚀 ${req.method} ${req.path}`);
      console.log('📥 Body:', req.body);
      console.log('🔑 Headers:', req.headers);

      const event = convertToAPIGatewayEvent(req);
      const result = await lambdaHandler(event);
      
      console.log('📤 Response:', result.statusCode, result.body);
      sendAPIGatewayResponse(res, result);
    } catch (error) {
      console.error('❌ Lambda function error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BookFlow Backend Local Server',
    timestamp: new Date().toISOString(),
    environment: 'local'
  });
});

// Auth routes
app.all('/v1/auth/*', handleLambdaFunction(authHandler));

// Organizations routes  
app.all('/v1/organizations*', handleLambdaFunction(organizationsHandler));

// Onboarding routes
app.get('/onboarding/status', handleLambdaFunction(getOnboardingStatus));
app.post('/onboarding/update', handleLambdaFunction(updateOnboardingStep));
app.post('/onboarding/reset', handleLambdaFunction(resetOnboarding));

// Catch all for unmatched routes
app.all('*', (req, res) => {
  console.log(`❓ Unmatched route: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('💥 Global error handler:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: error.message
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('🚀 BookFlow Backend Local Server');
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log('🏗️  Environment: LOCAL DEVELOPMENT');
  console.log('📊 Mock AWS Services enabled');
  console.log('');
  console.log('🔗 Available endpoints:');
  console.log('  📋 GET  /health');
  console.log('  🔐 POST /v1/auth/register');
  console.log('  🔐 POST /v1/auth/login');  
  console.log('  🔐 GET  /v1/auth/me');
  console.log('  🏢 GET  /v1/organizations/me');
  console.log('  🏢 PUT  /v1/organizations/:orgId/settings');
  console.log('  🎯 GET  /onboarding/status');
  console.log('  🎯 POST /onboarding/update');
  console.log('  🎯 POST /onboarding/reset');
  console.log('');
  console.log('⚠️  Note: Using mock AWS services for local development');
  console.log('💾 Data will be stored in memory/mock services');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📥 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('🛑 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📥 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('🛑 Server closed');
    process.exit(0);
  });
});