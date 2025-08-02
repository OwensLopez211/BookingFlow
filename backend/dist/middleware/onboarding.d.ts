import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export declare const requireOnboardingComplete: (event: APIGatewayProxyEvent) => Promise<{
    isComplete: boolean;
    user?: any;
    response?: APIGatewayProxyResult;
}>;
export declare const withOnboardingCheck: (handler: (event: APIGatewayProxyEvent, user: any) => Promise<APIGatewayProxyResult>) => (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const shouldCheckOnboarding: (path: string) => boolean;
