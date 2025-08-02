import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export declare const migrateOrganization: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const validateMigration: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getCompatibilityReport: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
