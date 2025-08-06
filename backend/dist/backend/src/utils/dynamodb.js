"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryItems = exports.deleteItem = exports.updateItem = exports.putItem = exports.getItem = exports.TABLES = exports.dynamoClient = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({
    region: process.env.REGION || 'sa-east-1',
});
exports.dynamoClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
exports.TABLES = {
    USERS: process.env.USERS_TABLE,
    ORGANIZATIONS: process.env.ORGANIZATIONS_TABLE,
    APPOINTMENTS: process.env.APPOINTMENTS_TABLE,
};
// Utilidades para operaciones comunes de DynamoDB
const getItem = async (tableName, key) => {
    const command = new lib_dynamodb_1.GetCommand({
        TableName: tableName,
        Key: key,
    });
    const result = await exports.dynamoClient.send(command);
    return result.Item;
};
exports.getItem = getItem;
const putItem = async (tableName, item) => {
    const command = new lib_dynamodb_1.PutCommand({
        TableName: tableName,
        Item: {
            ...item,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    });
    await exports.dynamoClient.send(command);
    return item;
};
exports.putItem = putItem;
const updateItem = async (tableName, key, updates) => {
    const updateExpression = 'SET ' + Object.keys(updates)
        .map((key, index) => `#${key} = :${key}`)
        .join(', ') + ', #updatedAt = :updatedAt';
    const expressionAttributeNames = Object.keys(updates).reduce((acc, key) => {
        acc[`#${key}`] = key;
        return acc;
    }, {});
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    const expressionAttributeValues = Object.entries(updates).reduce((acc, [key, value]) => {
        acc[`:${key}`] = value;
        return acc;
    }, {});
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    const command = new lib_dynamodb_1.UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
    });
    const result = await exports.dynamoClient.send(command);
    return result.Attributes;
};
exports.updateItem = updateItem;
const deleteItem = async (tableName, key) => {
    const command = new lib_dynamodb_1.DeleteCommand({
        TableName: tableName,
        Key: key,
    });
    await exports.dynamoClient.send(command);
};
exports.deleteItem = deleteItem;
const queryItems = async (tableName, keyConditionExpression, expressionAttributeNames, expressionAttributeValues, indexName) => {
    const command = new lib_dynamodb_1.QueryCommand({
        TableName: tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        IndexName: indexName,
    });
    const result = await exports.dynamoClient.send(command);
    return result.Items || [];
};
exports.queryItems = queryItems;
