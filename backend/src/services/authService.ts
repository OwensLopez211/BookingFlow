import { z } from 'zod';
import { createCognitoUser, loginUser, getCognitoUser } from '../utils/cognito';
import { createUser, getUserByCognitoId } from '../repositories/userRepository';
import { createOrganization, getDefaultOrganizationSettings } from '../repositories/organizationRepository';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  organizationName: z.string().min(2, 'El nombre de la organización debe tener al menos 2 caracteres'),
  templateType: z.enum(['beauty_salon', 'hyperbaric_center']),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  templateType: 'beauty_salon' | 'hyperbaric_center';
}

export interface LoginData {
  email: string;
  password: string;
}

export const registerUserAndOrganization = async (data: RegisterData) => {
  const validatedData = registerSchema.parse(data);
  
  try {
    // 1. Crear organización
    const orgDefaults = getDefaultOrganizationSettings(validatedData.templateType);
    const organization = await createOrganization({
      name: validatedData.organizationName,
      templateType: validatedData.templateType,
      ...orgDefaults,
    });

    // 2. Crear usuario en Cognito
    const cognitoResult = await createCognitoUser({
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
    const user = await createUser({
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
    const loginResult = await loginUser({
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
  } catch (error: any) {
    console.error('Error in registerUserAndOrganization:', error);
    throw new Error(error.message || 'Error durante el registro');
  }
};

export const loginUserService = async (data: LoginData) => {
  const validatedData = loginSchema.parse(data);

  try {
    // 1. Autenticar con Cognito
    const cognitoResult = await loginUser(validatedData);

    // 2. Verificar que tenemos accessToken
    if (!cognitoResult.tokens.accessToken) {
      throw new Error('Error obteniendo token de acceso');
    }

    // 3. Obtener información del usuario desde Cognito
    const cognitoUserInfo = await getCognitoUser(cognitoResult.tokens.accessToken);

    // 4. Verificar que tenemos cognitoId
    if (!cognitoUserInfo.user.cognitoId) {
      throw new Error('Error obteniendo ID de usuario de Cognito');
    }

    // 5. Obtener información adicional desde DynamoDB
    const user = await getUserByCognitoId(cognitoUserInfo.user.cognitoId);

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
  } catch (error: any) {
    console.error('Error in loginUserService:', error);
    throw new Error(error.message || 'Error durante el login');
  }
};

export const getCurrentUserService = async (accessToken: string) => {
  try {
    const cognitoUserInfo = await getCognitoUser(accessToken);
    
    if (!cognitoUserInfo.user.cognitoId) {
      throw new Error('Error obteniendo ID de usuario de Cognito');
    }
    
    const user = await getUserByCognitoId(cognitoUserInfo.user.cognitoId);

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
  } catch (error: any) {
    console.error('Error in getCurrentUserService:', error);
    throw new Error(error.message || 'Error obteniendo información del usuario');
  }
};
