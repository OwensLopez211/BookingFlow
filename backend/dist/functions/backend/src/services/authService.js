"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUserService = exports.loginUserService = exports.registerUserAndOrganization = void 0;
const zod_1 = require("zod");
const cognito_1 = require("../utils/cognito");
const userRepository_1 = require("../repositories/userRepository");
const organizationRepository_1 = require("../repositories/organizationRepository");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
    firstName: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: zod_1.z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    organizationName: zod_1.z.string().min(2, 'El nombre de la organización debe tener al menos 2 caracteres'),
    templateType: zod_1.z.enum(['beauty_salon', 'hyperbaric_center']),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});
const registerUserAndOrganization = async (data) => {
    const validatedData = registerSchema.parse(data);
    try {
        // 1. Crear organización
        const orgDefaults = (0, organizationRepository_1.getDefaultOrganizationSettings)(validatedData.templateType);
        const organization = await (0, organizationRepository_1.createOrganization)({
            name: validatedData.organizationName,
            templateType: validatedData.templateType,
            ...orgDefaults,
        });
        // 2. Crear usuario en Cognito
        const cognitoResult = await (0, cognito_1.createCognitoUser)({
            email: validatedData.email,
            password: validatedData.password,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            orgId: organization.id,
            role: 'owner',
        });
        // 3. Verificar que cognitoId existe
        if (!cognitoResult.cognitoId) {
            throw new Error('Error obteniendo ID de Cognito');
        }
        // 4. Crear usuario en DynamoDB
        const user = await (0, userRepository_1.createUser)({
            cognitoId: cognitoResult.cognitoId,
            email: validatedData.email,
            role: 'owner',
            orgId: organization.id,
            profile: {
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
            },
        });
        // 5. Login automático después del registro
        const loginResult = await (0, cognito_1.loginUser)({
            email: validatedData.email,
            password: validatedData.password,
        });
        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                orgId: user.orgId,
                profile: user.profile,
            },
            organization: {
                id: organization.id,
                name: organization.name,
                templateType: organization.templateType,
            },
            tokens: loginResult.tokens,
            message: 'Usuario y organización creados exitosamente',
        };
    }
    catch (error) {
        console.error('Error in registerUserAndOrganization:', error);
        throw new Error(error.message || 'Error durante el registro');
    }
};
exports.registerUserAndOrganization = registerUserAndOrganization;
const loginUserService = async (data) => {
    const validatedData = loginSchema.parse(data);
    try {
        // 1. Autenticar con Cognito
        const cognitoResult = await (0, cognito_1.loginUser)(validatedData);
        // 2. Verificar que tenemos accessToken
        if (!cognitoResult.tokens.accessToken) {
            throw new Error('Error obteniendo token de acceso');
        }
        // 3. Obtener información del usuario desde Cognito
        const cognitoUserInfo = await (0, cognito_1.getCognitoUser)(cognitoResult.tokens.accessToken);
        // 4. Verificar que tenemos cognitoId
        if (!cognitoUserInfo.user.cognitoId) {
            throw new Error('Error obteniendo ID de usuario de Cognito');
        }
        // 5. Obtener información adicional desde DynamoDB
        const user = await (0, userRepository_1.getUserByCognitoId)(cognitoUserInfo.user.cognitoId);
        if (!user) {
            throw new Error('Usuario no encontrado en el sistema');
        }
        return {
            success: true,
            tokens: cognitoResult.tokens,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                orgId: user.orgId,
                profile: user.profile,
                cognitoId: user.cognitoId,
            },
            expiresIn: cognitoResult.expiresIn,
            message: 'Bienvenido de nuevo' + user.profile.firstName + '!',
        };
    }
    catch (error) {
        console.error('Error in loginUserService:', error);
        throw new Error(error.message || 'Error durante el login');
    }
};
exports.loginUserService = loginUserService;
const getCurrentUserService = async (accessToken) => {
    try {
        const cognitoUserInfo = await (0, cognito_1.getCognitoUser)(accessToken);
        if (!cognitoUserInfo.user.cognitoId) {
            throw new Error('Error obteniendo ID de usuario de Cognito');
        }
        const user = await (0, userRepository_1.getUserByCognitoId)(cognitoUserInfo.user.cognitoId);
        if (!user) {
            throw new Error('Usuario no encontrado en el sistema');
        }
        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                orgId: user.orgId,
                profile: user.profile,
                cognitoId: user.cognitoId,
            },
        };
    }
    catch (error) {
        console.error('Error in getCurrentUserService:', error);
        throw new Error(error.message || 'Error obteniendo información del usuario');
    }
};
exports.getCurrentUserService = getCurrentUserService;
