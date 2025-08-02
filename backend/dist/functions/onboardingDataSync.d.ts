import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Endpoint para forzar sincronización manual de datos del onboarding
 */
export declare const forceDataSync: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
/**
 * Endpoint para verificar el estado de sincronización de datos
 */
export declare const checkDataSyncStatus: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
/**
 * Endpoint para sincronizar un step específico
 */
export declare const syncSpecificStep: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
