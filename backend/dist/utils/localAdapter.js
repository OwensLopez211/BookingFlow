"use strict";
/**
 * Local Development Adapter
 * This file replaces AWS services with local mock implementations
 * when running in local development mode
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeDynamoCommand = exports.executeCognitoCommand = exports.createDynamoCommand = exports.createCognitoCommand = exports.getDynamoDBClient = exports.getCognitoClient = void 0;
const awsServices_1 = require("../mocks/awsServices");
const isLocalDevelopment = process.env.STAGE === 'local';
if (isLocalDevelopment) {
    console.log('🔧 Local Development Mode: Initializing mock AWS services');
    (0, awsServices_1.initializeDefaultData)();
}
// Cognito Client Mock
const getCognitoClient = () => {
    if (isLocalDevelopment) {
        console.log('🏠 Using mock Cognito client');
        return awsServices_1.mockCognito;
    }
    // In production, return real AWS SDK client
    const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');
    return new CognitoIdentityProviderClient({ region: process.env.REGION });
};
exports.getCognitoClient = getCognitoClient;
// DynamoDB Client Mock  
const getDynamoDBClient = () => {
    if (isLocalDevelopment) {
        return awsServices_1.mockDynamoDB;
    }
    // In production, return real AWS SDK client
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
    const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
    return dynamoClient;
};
exports.getDynamoDBClient = getDynamoDBClient;
// Command adapters
const createCognitoCommand = (commandName, params) => {
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
exports.createCognitoCommand = createCognitoCommand;
const createDynamoCommand = (commandName, params) => {
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
exports.createDynamoCommand = createDynamoCommand;
// Command executors
const executeCognitoCommand = async (command) => {
    const cognitoClient = (0, exports.getCognitoClient)();
    if (isLocalDevelopment) {
        // Execute mock command
        switch (command.commandName) {
            case 'AdminCreateUserCommand':
                return await cognitoClient.adminCreateUser(command.params);
            case 'AdminSetUserPasswordCommand':
                return await cognitoClient.adminSetUserPassword(command.params);
            case 'InitiateAuthCommand':
                return await cognitoClient.initiateAuth(command.params);
            case 'GetUserCommand':
                return await cognitoClient.getUser(command.params);
            default:
                throw new Error(`Unknown mock Cognito command: ${command.commandName}`);
        }
    }
    // In production, use real AWS SDK
    return await cognitoClient.send(command);
};
exports.executeCognitoCommand = executeCognitoCommand;
const executeDynamoCommand = async (command) => {
    const dynamoClient = (0, exports.getDynamoDBClient)();
    if (isLocalDevelopment) {
        // Execute mock command
        switch (command.commandName) {
            case 'PutCommand':
                return await dynamoClient.put(command.params);
            case 'GetCommand':
                return await dynamoClient.get(command.params);
            case 'QueryCommand':
                return await dynamoClient.query(command.params);
            case 'ScanCommand':
                return await dynamoClient.scan(command.params);
            default:
                throw new Error(`Unknown mock DynamoDB command: ${command.commandName}`);
        }
    }
    // In production, use real AWS SDK
    return await dynamoClient.send(command);
};
exports.executeDynamoCommand = executeDynamoCommand;
