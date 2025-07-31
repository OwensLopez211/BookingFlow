import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.REGION || 'sa-east-1',
});

export const dynamoClient = DynamoDBDocumentClient.from(client);

export const TABLES = {
  USERS: process.env.USERS_TABLE!,
  ORGANIZATIONS: process.env.ORGANIZATIONS_TABLE!,
  APPOINTMENTS: process.env.APPOINTMENTS_TABLE!,
};

// Utilidades para operaciones comunes de DynamoDB
export const getItem = async (tableName: string, key: Record<string, any>) => {
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });

  const result = await dynamoClient.send(command);
  return result.Item;
};

export const putItem = async (tableName: string, item: Record<string, any>) => {
  const command = new PutCommand({
    TableName: tableName,
    Item: {
      ...item,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  await dynamoClient.send(command);
  return item;
};

export const updateItem = async (
  tableName: string,
  key: Record<string, any>,
  updates: Record<string, any>
) => {
  const updateExpression = 'SET ' + Object.keys(updates)
    .map((key, index) => `#${key} = :${key}`)
    .join(', ') + ', #updatedAt = :updatedAt';

  const expressionAttributeNames = Object.keys(updates).reduce((acc, key) => {
    acc[`#${key}`] = key;
    return acc;
  }, {} as Record<string, string>);
  expressionAttributeNames['#updatedAt'] = 'updatedAt';

  const expressionAttributeValues = Object.entries(updates).reduce((acc, [key, value]) => {
    acc[`:${key}`] = value;
    return acc;
  }, {} as Record<string, any>);
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });

  const result = await dynamoClient.send(command);
  return result.Attributes;
};

export const deleteItem = async (tableName: string, key: Record<string, any>) => {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key,
  });

  await dynamoClient.send(command);
};

export const queryItems = async (
  tableName: string,
  keyConditionExpression: string,
  expressionAttributeNames?: Record<string, string>,
  expressionAttributeValues?: Record<string, any>,
  indexName?: string
) => {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    IndexName: indexName,
  });

  const result = await dynamoClient.send(command);
  return result.Items || [];
};