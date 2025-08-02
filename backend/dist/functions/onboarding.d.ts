import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export declare const getOnboardingStatus: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const updateOnboardingStep: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const syncOnboardingToOrganization: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const resetOnboarding: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
