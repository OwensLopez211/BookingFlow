import { APIGatewayProxyResult } from 'aws-lambda';
export declare const cronHandler: (event: import("aws-lambda").APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const manualHandler: (event: import("aws-lambda").APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
