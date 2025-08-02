import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Endpoint para probar la actualización completa de settings
 * Simula exactamente lo que envía el frontend
 */
export declare const testCompleteSettingsUpdate: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
