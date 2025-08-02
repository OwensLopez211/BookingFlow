import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export declare const createBusinessConfiguration: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getBusinessConfiguration: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const updateBusinessConfiguration: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const initializeBusinessConfiguration: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getIndustryTemplates: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const generateOrganizationAvailability: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getAvailableSlots: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
