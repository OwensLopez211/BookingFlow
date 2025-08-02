"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDefaultData = exports.mockDynamoDB = exports.mockCognito = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = 'local-development-secret-key-for-bookflow';
const DATA_DIR = path_1.default.join(__dirname, '../../data');
// Ensure data directory exists
if (!fs_1.default.existsSync(DATA_DIR)) {
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
}
// Simple file-based storage
class LocalStorage {
    getFilePath(tableName) {
        return path_1.default.join(DATA_DIR, `${tableName}.json`);
    }
    readTable(tableName) {
        try {
            const filePath = this.getFilePath(tableName);
            if (fs_1.default.existsSync(filePath)) {
                const data = fs_1.default.readFileSync(filePath, 'utf8');
                return JSON.parse(data);
            }
            return [];
        }
        catch (error) {
            console.error(`Error reading table ${tableName}:`, error);
            return [];
        }
    }
    writeTable(tableName, data) {
        try {
            const filePath = this.getFilePath(tableName);
            fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error(`Error writing table ${tableName}:`, error);
            throw error;
        }
    }
    put(tableName, item) {
        const data = this.readTable(tableName);
        const existingIndex = data.findIndex(existingItem => existingItem.PK === item.PK && existingItem.SK === item.SK);
        if (existingIndex >= 0) {
            data[existingIndex] = item;
        }
        else {
            data.push(item);
        }
        this.writeTable(tableName, data);
    }
    get(tableName, key) {
        const data = this.readTable(tableName);
        return data.find(item => item.PK === key.PK && item.SK === key.SK) || null;
    }
    query(tableName, indexName, keyCondition) {
        const data = this.readTable(tableName);
        if (indexName === 'cognitoId-index') {
            return data.filter(item => item.cognitoId === keyCondition.cognitoId);
        }
        // Default PK query
        if (keyCondition.PK) {
            return data.filter(item => item.PK === keyCondition.PK);
        }
        return [];
    }
    scan(tableName) {
        return this.readTable(tableName);
    }
}
const localStorage = new LocalStorage();
// Mock Cognito Identity Provider
exports.mockCognito = {
    adminCreateUser: async (params) => {
        console.log('🏗️  Mock Cognito: Creating user', params.Username);
        // Check if user already exists
        const users = localStorage.scan('local-users');
        const existingUser = users.find((u) => u.email === params.Username);
        if (existingUser) {
            throw new Error('UsernameExistsException');
        }
        const cognitoId = (0, uuid_1.v4)();
        return {
            User: {
                Username: cognitoId,
                Attributes: params.UserAttributes,
                UserStatus: 'CONFIRMED'
            }
        };
    },
    adminSetUserPassword: async (params) => {
        console.log('🔑 Mock Cognito: Setting password for user', params.Username);
        // In real implementation, this would set the password
        // For mock, we'll handle password in our local storage
        return { success: true };
    },
    initiateAuth: async (params) => {
        console.log('🔐 Mock Cognito: Authenticate user', params.AuthParameters.USERNAME);
        const users = localStorage.scan('local-users');
        const user = users.find((u) => u.email === params.AuthParameters.USERNAME);
        if (!user) {
            throw new Error('NotAuthorizedException');
        }
        // Check password
        const isValidPassword = await bcryptjs_1.default.compare(params.AuthParameters.PASSWORD, user.password);
        if (!isValidPassword) {
            throw new Error('NotAuthorizedException');
        }
        const token = jsonwebtoken_1.default.sign({
            sub: user.cognitoId,
            username: user.cognitoId,
            email: user.email,
            role: user.role,
            orgId: user.orgId,
            'custom:orgId': user.orgId,
            'custom:role': user.role,
            'custom:firstName': user.profile.firstName,
            'custom:lastName': user.profile.lastName,
        }, JWT_SECRET, { expiresIn: '24h' });
        return {
            AuthenticationResult: {
                AccessToken: token,
                IdToken: token,
                RefreshToken: token,
                ExpiresIn: 86400,
            }
        };
    },
    getUser: async (params) => {
        console.log('👤 Mock Cognito: Get user from token');
        try {
            const decoded = jsonwebtoken_1.default.verify(params.AccessToken, JWT_SECRET);
            const users = localStorage.scan('local-users');
            const user = users.find((u) => u.cognitoId === decoded.username);
            if (!user) {
                throw new Error('UserNotFoundException');
            }
            return {
                Username: user.cognitoId,
                UserAttributes: [
                    { Name: 'sub', Value: user.cognitoId },
                    { Name: 'email', Value: user.email },
                    { Name: 'given_name', Value: user.profile.firstName },
                    { Name: 'family_name', Value: user.profile.lastName },
                ]
            };
        }
        catch (error) {
            throw new Error('NotAuthorizedException');
        }
    }
};
// Mock DynamoDB
exports.mockDynamoDB = {
    put: async (params) => {
        console.log('💾 Mock DynamoDB: PUT to', params.TableName);
        localStorage.put(params.TableName, params.Item);
        return { success: true };
    },
    get: async (params) => {
        console.log('📖 Mock DynamoDB: GET from', params.TableName);
        const item = localStorage.get(params.TableName, params.Key);
        return { Item: item };
    },
    query: async (params) => {
        console.log('🔍 Mock DynamoDB: QUERY', params.TableName);
        let keyCondition = {};
        // Parse KeyConditionExpression
        if (params.KeyConditionExpression && params.ExpressionAttributeValues) {
            if (params.IndexName === 'cognitoId-index') {
                keyCondition.cognitoId = params.ExpressionAttributeValues[':cognitoId'];
            }
            else if (params.KeyConditionExpression.includes('PK = :pk')) {
                keyCondition.PK = params.ExpressionAttributeValues[':pk'];
            }
        }
        const items = localStorage.query(params.TableName, params.IndexName, keyCondition);
        return { Items: items };
    },
    scan: async (params) => {
        console.log('🔍 Mock DynamoDB: SCAN', params.TableName);
        const items = localStorage.scan(params.TableName);
        return { Items: items };
    }
};
// Initialize default data
const initializeDefaultData = () => {
    console.log('🌱 Initializing default data...');
    // Create default organization
    const defaultOrg = {
        PK: 'ORG#74e46f50-509d-451e-bf21-df12fbda7b77',
        SK: 'PROFILE',
        id: '74e46f50-509d-451e-bf21-df12fbda7b77',
        name: 'Mi Organización Local',
        templateType: 'beauty_salon',
        settings: {
            timezone: 'America/Santiago',
            businessHours: {
                monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                saturday: { isOpen: true, openTime: '09:00', closeTime: '15:00' },
                sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
            },
            notifications: {
                emailReminders: true,
                smsReminders: false,
                autoConfirmation: true,
                reminderHours: 24,
            },
        },
        subscription: {
            plan: 'free',
            limits: {
                maxResources: 2,
                maxAppointmentsPerMonth: 100,
                maxUsers: 3,
            },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    // Create default user
    const defaultUser = {
        PK: 'USER#test-user-123',
        SK: 'PROFILE',
        id: 'test-user-123',
        cognitoId: 'local-cognito-123',
        email: 'test@example.com',
        password: bcryptjs_1.default.hashSync('password123', 10),
        role: 'owner',
        orgId: '74e46f50-509d-451e-bf21-df12fbda7b77',
        profile: {
            firstName: 'Usuario',
            lastName: 'Local',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    // Check if data already exists
    const existingOrgs = localStorage.scan('local-organizations');
    const existingUsers = localStorage.scan('local-users');
    if (existingOrgs.length === 0) {
        localStorage.put('local-organizations', defaultOrg);
        console.log('✅ Default organization created');
    }
    if (existingUsers.length === 0) {
        localStorage.put('local-users', defaultUser);
        console.log('✅ Default user created');
        console.log('🧪 Test credentials: test@example.com / password123');
    }
};
exports.initializeDefaultData = initializeDefaultData;
