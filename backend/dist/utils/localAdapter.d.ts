/**
 * Local Development Adapter
 * This file replaces AWS services with local mock implementations
 * when running in local development mode
 */
export declare const getCognitoClient: () => any;
export declare const getDynamoDBClient: () => any;
export declare const createCognitoCommand: (commandName: string, params: any) => any;
export declare const createDynamoCommand: (commandName: string, params: any) => any;
export declare const executeCognitoCommand: (command: any) => Promise<any>;
export declare const executeDynamoCommand: (command: any) => Promise<any>;
