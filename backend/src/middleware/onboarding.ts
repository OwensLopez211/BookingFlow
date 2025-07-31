import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../utils/response';
import { verifyToken } from '../utils/cognito';
import { getUserByCognitoId } from '../repositories/userRepository';

export const requireOnboardingComplete = async (
  event: APIGatewayProxyEvent
): Promise<{ isComplete: boolean; user?: any; response?: APIGatewayProxyResult }> => {
  
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    if (!token) {
      return {
        isComplete: false,
        response: createResponse(401, { error: 'Token is required' })
      };
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return {
        isComplete: false,
        response: createResponse(401, { error: 'Invalid token' })
      };
    }

    const user = await getUserByCognitoId(decoded.username);
    if (!user) {
      return {
        isComplete: false,
        response: createResponse(404, { error: 'User not found' })
      };
    }

    // Check if onboarding is completed
    const isComplete = user.onboardingStatus?.isCompleted === true;
    
    if (!isComplete) {
      return {
        isComplete: false,
        user,
        response: createResponse(403, {
          error: 'Onboarding not completed',
          onboardingRequired: true,
          currentStep: user.onboardingStatus?.currentStep || 1,
          completedSteps: user.onboardingStatus?.completedSteps || []
        })
      };
    }

    return {
      isComplete: true,
      user
    };

  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return {
      isComplete: false,
      response: createResponse(500, { error: 'Internal server error' })
    };
  }
};

// Middleware wrapper for Lambda functions that require completed onboarding
export const withOnboardingCheck = (
  handler: (event: APIGatewayProxyEvent, user: any) => Promise<APIGatewayProxyResult>
) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const onboardingCheck = await requireOnboardingComplete(event);
    
    if (!onboardingCheck.isComplete) {
      return onboardingCheck.response!;
    }

    return handler(event, onboardingCheck.user);
  };
};

// List of paths that don't require onboarding completion
const ONBOARDING_EXEMPT_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/verify-email',
  '/onboarding/status',
  '/onboarding/update',
  '/onboarding/reset',
];

export const shouldCheckOnboarding = (path: string): boolean => {
  return !ONBOARDING_EXEMPT_PATHS.some(exemptPath => path.startsWith(exemptPath));
};