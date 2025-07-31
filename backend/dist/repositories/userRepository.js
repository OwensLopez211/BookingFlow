"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByCognitoId = exports.getUserById = exports.createUser = void 0;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const createUser = async (userData) => {
    const user = {
        id: (0, uuid_1.v4)(),
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const item = {
        PK: `USER#${user.id}`,
        SK: 'PROFILE',
        ...user,
    };
    await (0, dynamodb_1.putItem)(dynamodb_1.TABLES.USERS, item);
    return user;
};
exports.createUser = createUser;
const getUserById = async (userId) => {
    const item = await (0, dynamodb_1.getItem)(dynamodb_1.TABLES.USERS, {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
    });
    if (!item)
        return null;
    const { PK, SK, ...user } = item;
    return user;
};
exports.getUserById = getUserById;
const getUserByCognitoId = async (cognitoId) => {
    const items = await (0, dynamodb_1.queryItems)(dynamodb_1.TABLES.USERS, 'cognitoId = :cognitoId', undefined, { ':cognitoId': cognitoId }, 'cognitoId-index');
    if (!items.length)
        return null;
    const { PK, SK, ...user } = items[0];
    return user;
};
exports.getUserByCognitoId = getUserByCognitoId;
