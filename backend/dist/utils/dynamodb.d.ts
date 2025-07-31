import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
export declare const dynamoClient: DynamoDBDocumentClient;
export declare const TABLES: {
    USERS: string;
    ORGANIZATIONS: string;
    APPOINTMENTS: string;
};
export declare const getItem: (tableName: string, key: Record<string, any>) => Promise<Record<string, any> | undefined>;
export declare const putItem: (tableName: string, item: Record<string, any>) => Promise<Record<string, any>>;
export declare const updateItem: (tableName: string, key: Record<string, any>, updates: Record<string, any>) => Promise<Record<string, any> | undefined>;
export declare const deleteItem: (tableName: string, key: Record<string, any>) => Promise<void>;
export declare const queryItems: (tableName: string, keyConditionExpression: string, expressionAttributeNames?: Record<string, string>, expressionAttributeValues?: Record<string, any>, indexName?: string) => Promise<Record<string, any>[]>;
