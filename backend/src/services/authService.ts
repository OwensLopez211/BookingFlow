import { z } from 'zod';
import { createCognitoUser, loginUser, getCognitoUser } from '../utils/cognito';
import { createUser, getUserByCognitoId, getUserByEmail } from '../repositories/userRepository';
import { createOrganization, getDefaultOrganizationSettings } from '../repositories/organizationRepository';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

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

// Configuración del cliente Google OAuth
const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google Client ID no configurado');
  }
  return new OAuth2Client(clientId);
};

export interface GoogleAuthData {
  googleToken: string;
  organizationName?: string;
  templateType?: 'beauty_salon' | 'hyperbaric_center';
}

export const googleAuthService = async (data: GoogleAuthData) => {
  try {
    // 1. Verificar el token de Google
    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken: data.googleToken,
      audience: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Token de Google inválido');
    }

    const { email, given_name, family_name, sub: googleId, picture } = payload;

    if (!email) {
      throw new Error('No se pudo obtener el email de Google');
    }

    // 2. Verificar si el usuario ya existe
    let user = await getUserByEmail(email);
    let organization = null;

    if (!user) {
      // 3. Si el usuario no existe, registrar nuevo usuario
      // Usar datos temporales que serán actualizados en el onboarding
      const tempOrgName = data.organizationName || `Organización de ${given_name || 'Usuario'}`;
      const tempTemplateType = data.templateType || 'beauty_salon';

      // 3a. Crear organización
      const orgDefaults = getDefaultOrganizationSettings(tempTemplateType);
      organization = await createOrganization({
        name: tempOrgName,
        templateType: tempTemplateType,
        ...orgDefaults,
      });

      // 3b. Crear usuario con Google ID
      user = await createUser({
        email,
        role: 'owner',
        orgId: organization.id,
        profile: {
          firstName: given_name || 'Usuario',
          lastName: family_name || '',
          avatar: picture,
        },
        cognitoId: `google_${googleId}`, // Usar Google ID como Cognito ID
      });
    } else {
      // Si el usuario existe, actualizar avatar de Google si está disponible
      if (picture && user.profile.avatar !== picture) {
        user.profile.avatar = picture;
        // Aquí podrías actualizar el usuario en la base de datos si es necesario
      }
    }

    // 4. Generar tokens JWT personalizados (ya que no usamos Cognito)
    const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret-for-bookflow';
    
    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      phone: user.profile.phone,
      avatar: user.profile.avatar,
      provider: 'google',
      googleId,
    };

    const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, { 
      expiresIn: '1h',
      issuer: 'bookflow-dev'
    });

    const idToken = jwt.sign({ 
      ...accessTokenPayload,
      aud: 'bookflow-frontend' 
    }, JWT_SECRET, { 
      expiresIn: '1h',
      issuer: 'bookflow-dev'
    });

    const refreshToken = jwt.sign({ 
      sub: user.id,
      type: 'refresh'
    }, JWT_SECRET, { 
      expiresIn: '30d',
      issuer: 'bookflow-dev'
    });

    return {
      success: true,
      tokens: {
        accessToken,
        idToken,
        refreshToken,
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        profile: user.profile,
        cognitoId: user.cognitoId,
      },
      organization: organization || undefined,
      expiresIn: 3600,
      message: `¡Bienvenido ${user.profile.firstName}!`,
    };

  } catch (error: any) {
    console.error('Error in googleAuthService:', error);
    throw new Error(error.message || 'Error durante la autenticación con Google');
  }
};
