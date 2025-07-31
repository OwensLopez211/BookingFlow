import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  registerUserAndOrganization, 
  loginUserService, 
  getCurrentUserService 
} from '../services/authService';
import { 
  createResponse, 
  successResponse, 
  errorResponse, 
  unauthorizedResponse,
  serverErrorResponse 
} from '../utils/response';
import { forgotPassword, resetPassword } from '../utils/cognito';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('=== AUTH HANDLER ===');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { httpMethod, path, body, headers } = event;

    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
      return createResponse(200);
    }

    // Parse request body
    let requestData: any = {};
    if (body) {
      try {
        requestData = JSON.parse(body);
      } catch (error) {
        console.error('Error parsing request body:', error);
        return errorResponse('Invalid JSON in request body', 400);
      }
    }

    // REGISTER ENDPOINT
    if (path?.endsWith('/auth/register') && httpMethod === 'POST') {
      console.log('=== REGISTER REQUEST ===');
      
      const { email, password, firstName, lastName, organizationName, templateType } = requestData;
      
      // Basic validation
      if (!email || !password || !firstName || !lastName || !organizationName || !templateType) {
        return errorResponse('Todos los campos son requeridos', 400);
      }

      const result = await registerUserAndOrganization({
        email,
        password,
        firstName,
        lastName,
        organizationName,
        templateType,
      });

      console.log('Registration successful for:', email);
      return successResponse(result, 'Usuario registrado exitosamente');
    }

    // LOGIN ENDPOINT
    if (path?.endsWith('/auth/login') && httpMethod === 'POST') {
      console.log('=== LOGIN REQUEST ===');
      
      const { email, password } = requestData;
      
      if (!email || !password) {
        return errorResponse('Email y contraseña son requeridos', 400);
      }

      const result = await loginUserService({ email, password });

      console.log('Login successful for:', email);
      return successResponse(result, 'Login exitoso');
    }

    // FORGOT PASSWORD ENDPOINT
    if (path?.endsWith('/auth/forgot-password') && httpMethod === 'POST') {
      console.log('=== FORGOT PASSWORD REQUEST ===');
      
      const { email } = requestData;
      
      if (!email) {
        return errorResponse('Email es requerido', 400);
      }

      const result = await forgotPassword(email);

      console.log('Forgot password request for:', email);
      return successResponse(result, 'Código de recuperación enviado');
    }

    // RESET PASSWORD ENDPOINT
    if (path?.endsWith('/auth/reset-password') && httpMethod === 'POST') {
      console.log('=== RESET PASSWORD REQUEST ===');
      
      const { email, confirmationCode, newPassword } = requestData;
      
      if (!email || !confirmationCode || !newPassword) {
        return errorResponse('Email, código de confirmación y nueva contraseña son requeridos', 400);
      }

      const result = await resetPassword(email, confirmationCode, newPassword);

      console.log('Password reset successful for:', email);
      return successResponse(result, 'Contraseña restablecida exitosamente');
    }

    // GET CURRENT USER ENDPOINT (Protected)
    if (path?.endsWith('/auth/me') && httpMethod === 'GET') {
      console.log('=== GET CURRENT USER REQUEST ===');
      
      const authHeader = headers.Authorization || headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return unauthorizedResponse('Token de acceso requerido');
      }

      const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

      const result = await getCurrentUserService(accessToken);

      console.log('Get current user successful');
      return successResponse(result, 'Información del usuario obtenida');
    }

    // REFRESH TOKEN ENDPOINT
    if (path?.endsWith('/auth/refresh') && httpMethod === 'POST') {
      console.log('=== REFRESH TOKEN REQUEST ===');
      
      // TODO: Implementar refresh token logic
      return errorResponse('Endpoint de refresh token no implementado aún', 501);
    }

    // Route not found
    console.log('Route not found:', path, httpMethod);
    return errorResponse('Endpoint no encontrado', 404);

  } catch (error: any) {
    console.error('=== AUTH HANDLER ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    // Handle known errors
    if (error.message.includes('Ya existe un usuario')) {
      return errorResponse(error.message, 409); // Conflict
    }
    
    if (error.message.includes('Email o contraseña incorrectos')) {
      return errorResponse(error.message, 401); // Unauthorized
    }
    
    if (error.message.includes('Usuario no encontrado')) {
      return errorResponse(error.message, 404); // Not Found
    }

    if (error.message.includes('Token')) {
      return unauthorizedResponse(error.message);
    }

    // Generic server error
    return serverErrorResponse(`Error interno del servidor: ${error.message}`);
  }
};
