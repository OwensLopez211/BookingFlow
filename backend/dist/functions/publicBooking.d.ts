import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export declare const getPublicOrganization: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getPublicServices: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getPublicProfessionals: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getPublicDailyAvailabilityCounts: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getPublicAvailability: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const createPublicAppointment: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
