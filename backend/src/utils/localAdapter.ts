/**
 * Local Development Adapter
 * This file replaces AWS services with local mock implementations
 * when running in local development mode
 */

import { mockCognito, mockDynamoDB, initializeDefaultData } from '../mocks/awsServices';

const isLocalDevelopment = process.env.STAGE === 'local';

if (isLocalDevelopment) {
  console.log('🔧 Local Development Mode: Initializing mock AWS services');
  initializeDefaultData();
}

// Cognito Client Mock
export const getCognitoClient = () => {
  if (isLocalDevelopment) {
    console.log('🏠 Using mock Cognito client');
    return mockCognito;
  }
  
  // In production, return real AWS SDK client
  const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');
  return new CognitoIdentityProviderClient({ region: process.env.REGION });
};

// DynamoDB Client Mock  
export const getDynamoDBClient = () => {
  if (isLocalDevelopment) {
    return mockDynamoDB;
  }
  
  // In production, return real AWS SDK client
  const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
  const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
  return dynamoClient;
};

// Command adapters
export const createCognitoCommand = (commandName: string, params: any) => {
  if (isLocalDevelopment) {
    // Return params directly for mock, the mock service will handle it
    return { commandName, params };
  }
  
  // In production, create real AWS SDK commands
  const cognito = require('@aws-sdk/client-cognito-identity-provider');
  switch (commandName) {
    case 'AdminCreateUserCommand':
      return new cognito.AdminCreateUserCommand(params);
    case 'AdminSetUserPasswordCommand':
      return new cognito.AdminSetUserPasswordCommand(params);
    case 'InitiateAuthCommand':
      return new cognito.InitiateAuthCommand(params);
    case 'GetUserCommand':
      return new cognito.GetUserCommand(params);
    default:
      throw new Error(`Unknown Cognito command: ${commandName}`);
  }
};

export const createDynamoCommand = (commandName: string, params: any) => {
  if (isLocalDevelopment) {
    // Return params directly for mock, the mock service will handle it
    return { commandName, params };
  }
  
  // In production, create real AWS SDK commands
  const dynamo = require('@aws-sdk/lib-dynamodb');
  switch (commandName) {
    case 'PutCommand':
      return new dynamo.PutCommand(params);
    case 'GetCommand':
      return new dynamo.GetCommand(params);
    case 'QueryCommand':
      return new dynamo.QueryCommand(params);
    case 'ScanCommand':
      return new dynamo.ScanCommand(params);
    default:
      throw new Error(`Unknown DynamoDB command: ${commandName}`);
  }
};

// Command executors
export const executeCognitoCommand = async (command: any) => {
  const cognitoClient = getCognitoClient();
  
  if (isLocalDevelopment) {
    // Execute mock command
    switch (command.commandName) {
      case 'AdminCreateUserCommand':
        return await (cognitoClient as any).adminCreateUser(command.params);
      case 'AdminSetUserPasswordCommand':
        return await (cognitoClient as any).adminSetUserPassword(command.params);
      case 'InitiateAuthCommand':
        return await (cognitoClient as any).initiateAuth(command.params);
      case 'GetUserCommand':
        return await (cognitoClient as any).getUser(command.params);
      default:
        throw new Error(`Unknown mock Cognito command: ${command.commandName}`);
    }
  }
  
  // In production, use real AWS SDK
  return await (cognitoClient as any).send(command);
};

export const executeDynamoCommand = async (command: any) => {
  const dynamoClient = getDynamoDBClient();
  
  if (isLocalDevelopment) {
    // Execute mock command
    switch (command.commandName) {
      case 'PutCommand':
        return await (dynamoClient as any).put(command.params);
      case 'GetCommand':
        return await (dynamoClient as any).get(command.params);
      case 'QueryCommand':
        return await (dynamoClient as any).query(command.params);
      case 'ScanCommand':
        return await (dynamoClient as any).scan(command.params);
      default:
        throw new Error(`Unknown mock DynamoDB command: ${command.commandName}`);
    }
  }
  
  // In production, use real AWS SDK
  return await (dynamoClient as any).send(command);
};