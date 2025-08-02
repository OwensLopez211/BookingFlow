import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    AdminUpdateUserAttributesCommand,
    AdminGetUserCommand,
    InitiateAuthCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    RespondToAuthChallengeCommand,
    AdminDeleteUserCommand,
  } from '@aws-sdk/client-cognito-identity-provider';
  
  const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.REGION || 'sa-east-1',
  });
  
  const USER_POOL_ID = process.env.USER_POOL_ID!;
  const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;
  
  export interface CreateUserParams {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    orgId?: string;
    role?: string;
  }
  
  export interface LoginParams {
    email: string;
    password: string;
  }
  
  export const createCognitoUser = async (params: CreateUserParams) => {
    const { email, password, firstName, lastName, orgId, role } = params;
  
    try {
      // 1. Crear usuario en Cognito
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'given_name', Value: firstName },
          { Name: 'family_name', Value: lastName },
          ...(orgId ? [{ Name: 'custom:org_id', Value: orgId }] : []),
          ...(role ? [{ Name: 'custom:role', Value: role }] : []),
        ],
        MessageAction: 'SUPPRESS', // No enviar email de bienvenida
        TemporaryPassword: password + 'Temp1!',
      });
  
      const createResult = await cognitoClient.send(createUserCommand);
  
      // 2. Establecer contraseña permanente
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true,
      });
  
      await cognitoClient.send(setPasswordCommand);
  
      return {
        success: true,
        cognitoId: createResult.User?.Username,
        email,
      };
    } catch (error: any) {
      console.error('Error creating Cognito user:', error);
      
      // Mapear errores comunes
      if (error.name === 'UsernameExistsException') {
        throw new Error('Ya existe un usuario con este email');
      }
      if (error.name === 'InvalidPasswordException') {
        throw new Error('La contraseña no cumple con los requisitos de seguridad');
      }
      
      throw new Error(error.message || 'Error creando usuario');
    }
  };
  
  export const loginUser = async (params: LoginParams) => {
    const { email, password } = params;
  
    try {
      const authCommand = new InitiateAuthCommand({
        ClientId: USER_POOL_CLIENT_ID,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });
  
      const result = await cognitoClient.send(authCommand);
  
      if (result.ChallengeName) {
        throw new Error('Autenticación requiere pasos adicionales');
      }
  
      return {
        success: true,
        tokens: {
          accessToken: result.AuthenticationResult?.AccessToken,
          idToken: result.AuthenticationResult?.IdToken,
          refreshToken: result.AuthenticationResult?.RefreshToken,
        },
        expiresIn: result.AuthenticationResult?.ExpiresIn,
      };
    } catch (error: any) {
      console.error('Error during login:', error);
      
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Email o contraseña incorrectos');
      }
      if (error.name === 'UserNotConfirmedException') {
        throw new Error('Usuario no confirmado');
      }
      if (error.name === 'PasswordResetRequiredException') {
        throw new Error('Debe restablecer su contraseña');
      }
      
      throw new Error(error.message || 'Error durante el login');
    }
  };
  
  export const forgotPassword = async (email: string) => {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: USER_POOL_CLIENT_ID,
        Username: email,
      });
  
      await cognitoClient.send(command);
  
      return {
        success: true,
        message: 'Código de recuperación enviado al email',
      };
    } catch (error: any) {
      console.error('Error in forgot password:', error);
      
      if (error.name === 'UserNotFoundException') {
        throw new Error('No existe un usuario con este email');
      }
      
      throw new Error(error.message || 'Error enviando código de recuperación');
    }
  };
  
  export const resetPassword = async (email: string, confirmationCode: string, newPassword: string) => {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: USER_POOL_CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
      });
  
      await cognitoClient.send(command);
  
      return {
        success: true,
        message: 'Contraseña restablecida exitosamente',
      };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      
      if (error.name === 'CodeMismatchException') {
        throw new Error('Código de confirmación inválido');
      }
      if (error.name === 'ExpiredCodeException') {
        throw new Error('Código de confirmación expirado');
      }
      
      throw new Error(error.message || 'Error restableciendo contraseña');
    }
  };
  
  export const getCognitoUser = async (accessToken: string) => {
    try {
      // Decodificar el token para obtener el username
      const tokenPayload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
      const username = tokenPayload.username;
  
      const command = new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      });
  
      const result = await cognitoClient.send(command);
  
      // Convertir atributos a objeto
      const attributes: Record<string, string> = {};
      result.UserAttributes?.forEach((attr) => {
        if (attr.Name && attr.Value) {
          attributes[attr.Name] = attr.Value;
        }
      });
  
      return {
        success: true,
        user: {
          username: result.Username,
          email: attributes.email,
          firstName: attributes.given_name,
          lastName: attributes.family_name,
          orgId: attributes['custom:org_id'],
          role: attributes['custom:role'],
          emailVerified: attributes.email_verified === 'true',
          cognitoId: result.Username,
        },
      };
    } catch (error: any) {
      console.error('Error getting Cognito user:', error);
      throw new Error(error.message || 'Error obteniendo información del usuario');
    }
  };
  
  export const updateUserAttributes = async (username: string, attributes: Record<string, string>) => {
    try {
      const userAttributes = Object.entries(attributes).map(([name, value]) => ({
        Name: name,
        Value: value,
      }));
  
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        UserAttributes: userAttributes,
      });
  
      await cognitoClient.send(command);
  
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user attributes:', error);
      throw new Error(error.message || 'Error actualizando atributos del usuario');
    }
  };