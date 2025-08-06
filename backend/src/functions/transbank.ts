import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { transbankService } from '../services/transbankService';
import { getCurrentUserService } from '../services/authService';
import { getOrganizationService } from '../services/organizationService';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import {
  createResponse,
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '../utils/response';
import { withMetrics } from '../middleware/requestMetrics';
import { billingService } from '../services/billingService';
import { notificationService } from '../services/notificationService';

const extractUserFromToken = async (authHeader?: string) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token de acceso requerido');
  }

  const accessToken = authHeader.substring(7);
  const result = await getCurrentUserService(accessToken);
  
  if (!result.success || !result.user) {
    throw new Error('Token inválido o usuario no encontrado');
  }

  return result.user;
};

const transbankHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('=== TRANSBANK HANDLER ===');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { httpMethod, path, body, headers } = event;

    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
      return createResponse(200);
    }

    // Parse request body if present
    let requestData: any = {};
    if (body) {
      try {
        requestData = JSON.parse(body);
      } catch (error) {
        console.error('Error parsing request body:', error);
        return errorResponse('Invalid JSON in request body', 400);
      }
    }

    // Extract user from token for protected endpoints
    const authHeader = headers.Authorization || headers.authorization;
    let currentUser;
    
    try {
      currentUser = await extractUserFromToken(authHeader);
    } catch (error: any) {
      return unauthorizedResponse(error.message);
    }

    // CREATE PAYMENT TRANSACTION - DESHABILITADO TEMPORALMENTE
    if (path?.endsWith('/transbank/create-transaction') && httpMethod === 'POST') {
      console.log('=== CREATE PAYMENT TRANSACTION - DISABLED ===');
      return errorResponse('Los pagos están temporalmente deshabilitados. Solo se permite el registro con mes gratuito.', 400);
    }

    // CONFIRM PAYMENT TRANSACTION - DESHABILITADO TEMPORALMENTE
    if (path?.endsWith('/transbank/confirm-transaction') && httpMethod === 'POST') {
      console.log('=== CONFIRM PAYMENT TRANSACTION - DISABLED ===');
      return errorResponse('Los pagos están temporalmente deshabilitados.', 400);
    }

    // VERIFY PAYMENT - DESHABILITADO TEMPORALMENTE
    if (path?.match(/\/transbank\/verify-payment\/(.+)$/) && httpMethod === 'GET') {
      console.log('=== VERIFY PAYMENT - DISABLED ===');
      return errorResponse('Los pagos están temporalmente deshabilitados.', 400);
    }

    // GET SUBSCRIPTION STATUS
    if (path?.match(/\/transbank\/subscription\/(.+)$/) && httpMethod === 'GET') {
      console.log('=== GET SUBSCRIPTION STATUS ===');
      
      const organizationId = path.split('/').pop();
      if (!organizationId) {
        return errorResponse('Organization ID requerido', 400);
      }

      // Verify user has access to organization
      if (currentUser.orgId !== organizationId) {
        return unauthorizedResponse('No tienes permisos para esta organización');
      }

      try {
        // Get subscription from our database
        const subscription = await subscriptionRepository.getByOrganizationId(organizationId);
        
        if (!subscription) {
          return successResponse(null, 'No subscription found');
        }

        // Format subscription data for frontend
        const formattedSubscription = {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          trial_end: subscription.trial_end,
          plan: {
            id: subscription.plan_id || 'basic',
            name: 'Plan Básico',
            amount: 12990,
            currency: 'CLP',
            interval: 'month'
          }
        };

        return successResponse(formattedSubscription, 'Estado de suscripción obtenido exitosamente');
      } catch (error: any) {
        console.error('Error getting subscription:', error);
        return serverErrorResponse(`Error obteniendo suscripción: ${error.message}`);
      }
    }

    // CANCEL SUBSCRIPTION
    if (path?.endsWith('/transbank/cancel-subscription') && httpMethod === 'POST') {
      console.log('=== CANCEL SUBSCRIPTION ===');
      
      const { organizationId } = requestData;
      
      if (!organizationId) {
        return errorResponse('Organization ID requerido', 400);
      }

      // Verify user has access to organization and is owner
      if (currentUser.orgId !== organizationId || currentUser.role !== 'owner') {
        return unauthorizedResponse('Solo los propietarios pueden cancelar suscripciones');
      }

      try {
        const subscriptionId = `sub_${organizationId}`; // This would come from DB
        const result = await transbankService.cancelSubscription(subscriptionId);
        return successResponse({ success: true, subscription: result }, 'Suscripción cancelada exitosamente');
      } catch (error: any) {
        console.error('Error canceling subscription:', error);
        return serverErrorResponse(`Error cancelando suscripción: ${error.message}`);
      }
    }

    // START FREE TRIAL
    if (path?.endsWith('/transbank/start-free-trial') && httpMethod === 'POST') {
      console.log('=== START FREE TRIAL ===');
      
      const { planId, organizationId, trialDays } = requestData;
      
      if (!planId || !organizationId || !trialDays) {
        return errorResponse('Plan ID, Organization ID y trial days requeridos', 400);
      }

      // Verify user has access to organization
      if (currentUser.orgId !== organizationId) {
        return unauthorizedResponse('No tienes permisos para esta organización');
      }

      try {
        // Check if organization already has a subscription
        // This would check the subscription repository
        
        const subscription = await transbankService.startFreeTrial(
          planId,
          organizationId,
          trialDays,
          currentUser.email
        );

        return successResponse({ 
          success: true,
          subscription 
        }, 'Prueba gratuita iniciada exitosamente');
      } catch (error: any) {
        console.error('Error starting free trial:', error);
        return serverErrorResponse(`Error iniciando prueba gratuita: ${error.message}`);
      }
    }

    // GENERATE MONTHLY BILLING - DESHABILITADO TEMPORALMENTE
    if (path?.endsWith('/transbank/generate-billing') && httpMethod === 'POST') {
      console.log('=== GENERATE MONTHLY BILLING - DISABLED ===');
      return errorResponse('La facturación automática está temporalmente deshabilitada.', 400);
    }

    // PAYMENT CONFIRMATION WEBHOOK - DESHABILITADO TEMPORALMENTE
    if (path?.endsWith('/transbank/payment-confirmation') && httpMethod === 'POST') {
      console.log('=== PAYMENT CONFIRMATION WEBHOOK - DISABLED ===');
      return errorResponse('Los pagos están temporalmente deshabilitados.', 400);
    }

    // ============ ONECLICK ENDPOINTS ============

    // START ONECLICK INSCRIPTION
    if (path?.endsWith('/transbank/oneclick/start-inscription') && httpMethod === 'POST') {
      console.log('=== START ONECLICK INSCRIPTION ===');
      
      const { username, email, returnUrl } = requestData;
      
      if (!username || !email || !returnUrl) {
        return errorResponse('Username, email y returnUrl requeridos', 400);
      }

      try {
        const result = await transbankService.startOneclickInscription({
          username,
          email,
          returnUrl
        });
        
        return successResponse(result, 'Inscripción OneClick iniciada exitosamente');
      } catch (error: any) {
        console.error('Error starting OneClick inscription:', error);
        return serverErrorResponse(`Error iniciando inscripción OneClick: ${error.message}`);
      }
    }

    // FINISH ONECLICK INSCRIPTION
    if (path?.endsWith('/transbank/oneclick/finish-inscription') && httpMethod === 'POST') {
      console.log('=== FINISH ONECLICK INSCRIPTION ===');
      
      const { token } = requestData;
      
      if (!token) {
        return errorResponse('Token requerido', 400);
      }

      try {
        const result = await transbankService.finishOneclickInscription({ token });
        
        return successResponse(result, 'Inscripción OneClick finalizada exitosamente');
      } catch (error: any) {
        console.error('Error finishing OneClick inscription:', error);
        return serverErrorResponse(`Error finalizando inscripción OneClick: ${error.message}`);
      }
    }

    // REMOVE ONECLICK INSCRIPTION
    if (path?.endsWith('/transbank/oneclick/remove-inscription') && httpMethod === 'POST') {
      console.log('=== REMOVE ONECLICK INSCRIPTION ===');
      
      const { tbkUser, username } = requestData;
      
      if (!tbkUser || !username) {
        return errorResponse('tbkUser y username requeridos', 400);
      }

      try {
        const result = await transbankService.removeOneclickInscription(tbkUser, username);
        
        return successResponse(result, 'Inscripción OneClick eliminada exitosamente');
      } catch (error: any) {
        console.error('Error removing OneClick inscription:', error);
        return serverErrorResponse(`Error eliminando inscripción OneClick: ${error.message}`);
      }
    }

    // CHARGE ONECLICK
    if (path?.endsWith('/transbank/oneclick/charge') && httpMethod === 'POST') {
      console.log('=== CHARGE ONECLICK ===');
      
      const { username, tbkUser, buyOrder, amount, childCommerceCode } = requestData;
      
      if (!username || !tbkUser || !buyOrder || !amount) {
        return errorResponse('Username, tbkUser, buyOrder y amount requeridos', 400);
      }

      try {
        const result = await transbankService.chargeOneclick({
          username,
          tbkUser,
          buyOrder,
          amount,
          childCommerceCode
        });
        
        return successResponse(result, 'Cobro OneClick ejecutado exitosamente');
      } catch (error: any) {
        console.error('Error charging OneClick:', error);
        return serverErrorResponse(`Error ejecutando cobro OneClick: ${error.message}`);
      }
    }

    // START TRIAL WITH ONECLICK
    if (path?.endsWith('/transbank/start-trial-with-oneclick') && httpMethod === 'POST') {
      console.log('=== START TRIAL WITH ONECLICK ===');
      
      const { planId, organizationId, trialDays, oneclickToken, oneclickUsername } = requestData;
      
      if (!planId || !organizationId || !trialDays || !oneclickToken || !oneclickUsername) {
        return errorResponse('Todos los campos requeridos: planId, organizationId, trialDays, oneclickToken, oneclickUsername', 400);
      }

      // Verify user has access to organization
      if (currentUser.orgId !== organizationId) {
        return unauthorizedResponse('No tienes permisos para esta organización');
      }

      try {
        // Check if organization already has a subscription
        const existingSubscription = await subscriptionRepository.getByOrganizationId(organizationId);
        
        if (existingSubscription) {
          return errorResponse('La organización ya tiene una suscripción activa', 400);
        }

        // Create subscription with OneClick data (but not complete inscription yet)
        const now = Math.floor(Date.now() / 1000);
        const trialEnd = now + (trialDays * 24 * 60 * 60);
        const periodEnd = now + (30 * 24 * 60 * 60);

        const subscription = await subscriptionRepository.createSubscription({
          organizationId,
          customerId: `cus_${organizationId}`,
          planId,
          planName: 'Plan Básico',
          status: 'trialing',
          current_period_start: now,
          current_period_end: periodEnd,
          trial_start: now,
          trial_end: trialEnd,
          amount: 14990,
          currency: 'CLP',
          interval: 'month',
          payment_method: 'transbank_oneclick',
          // OneClick specific fields
          oneclick_username: oneclickUsername,
          oneclick_inscription_token: oneclickToken,
          oneclick_active: false, // Will be true after successful inscription
          payment_attempts: 0,
        });

        return successResponse({ 
          success: true,
          subscription,
          message: 'Trial iniciado. Completa la inscripción OneClick para activar el cobro automático.'
        }, 'Trial con OneClick iniciado exitosamente');
      } catch (error: any) {
        console.error('Error starting trial with OneClick:', error);
        return serverErrorResponse(`Error iniciando trial con OneClick: ${error.message}`);
      }
    }

    // COMPLETE ONECLICK INSCRIPTION (after user returns from Transbank)
    if (path?.endsWith('/transbank/oneclick/complete-inscription') && httpMethod === 'POST') {
      console.log('=== COMPLETE ONECLICK INSCRIPTION ===');
      
      const { organizationId, token } = requestData;
      
      if (!organizationId || !token) {
        return errorResponse('OrganizationId y token requeridos', 400);
      }

      // Verify user has access to organization
      if (currentUser.orgId !== organizationId) {
        return unauthorizedResponse('No tienes permisos para esta organización');
      }

      try {
        // Get subscription
        const subscription = await subscriptionRepository.getByOrganizationId(organizationId);
        
        if (!subscription) {
          return errorResponse('Suscripción no encontrada', 404);
        }

        if (subscription.oneclick_inscription_token !== token) {
          return errorResponse('Token de inscripción inválido', 400);
        }

        // Finish OneClick inscription
        const inscriptionResult = await transbankService.finishOneclickInscription({ token });
        
        if (inscriptionResult.success && inscriptionResult.tbkUser) {
          // Update subscription with OneClick user ID
          const updatedSubscription = await subscriptionRepository.updateSubscription(subscription.id, {
            oneclick_user_id: inscriptionResult.tbkUser,
            oneclick_active: true,
            oneclick_inscription_date: Math.floor(Date.now() / 1000),
          });

          return successResponse({
            success: true,
            subscription: updatedSubscription,
            inscriptionResult
          }, 'Inscripción OneClick completada exitosamente');
        } else {
          return errorResponse('Error completando la inscripción OneClick', 400);
        }
      } catch (error: any) {
        console.error('Error completing OneClick inscription:', error);
        return serverErrorResponse(`Error completando inscripción OneClick: ${error.message}`);
      }
    }

    // GET ONECLICK STATUS
    if (path?.match(/\/transbank\/oneclick\/status\/(.+)$/) && httpMethod === 'GET') {
      console.log('=== GET ONECLICK STATUS ===');
      
      const organizationId = path.split('/').pop();
      if (!organizationId) {
        return errorResponse('Organization ID requerido', 400);
      }

      // Verify user has access to organization
      if (currentUser.orgId !== organizationId) {
        return unauthorizedResponse('No tienes permisos para esta organización');
      }

      try {
        const subscription = await subscriptionRepository.getByOrganizationId(organizationId);
        
        if (!subscription) {
          return successResponse({
            hasOneClick: false,
            message: 'No se encontró suscripción'
          }, 'Estado OneClick obtenido');
        }

        const oneclickStatus = {
          hasOneClick: subscription.oneclick_active || false,
          username: subscription.oneclick_username,
          userId: subscription.oneclick_user_id,
          inscriptionDate: subscription.oneclick_inscription_date,
          paymentMethod: subscription.payment_method,
          status: subscription.status,
          trialEnd: subscription.trial_end,
          nextBillingDate: subscription.next_billing_date,
        };

        return successResponse(oneclickStatus, 'Estado OneClick obtenido exitosamente');
      } catch (error: any) {
        console.error('Error getting OneClick status:', error);
        return serverErrorResponse(`Error obteniendo estado OneClick: ${error.message}`);
      }
    }

    // ============ BILLING MANAGEMENT ENDPOINTS ============

    // MANUAL BILLING TRIGGER (for testing)
    if (path?.endsWith('/billing/run-daily') && httpMethod === 'POST') {
      console.log('=== MANUAL BILLING TRIGGER ===');
      
      // Only allow owner role to trigger manual billing
      if (currentUser.role !== 'owner') {
        return unauthorizedResponse('Solo los propietarios pueden ejecutar facturación manual');
      }

      try {
        const results = await billingService.runDailyBilling();

        return successResponse({
          success: true,
          results: {
            trialNotifications: results.trialNotifications.length,
            chargeResults: results.chargeResults,
            retryResults: results.retryResults,
            totalNotifications: results.totalNotifications,
            errorsCount: results.errors.length,
            errors: results.errors.slice(0, 10), // Limitar errores en respuesta
            alertsGenerated: results.alerts.length,
            alertsSent: results.alertResults.sent,
            alertsFailed: results.alertResults.failed,
          },
          timestamp: new Date().toISOString(),
        }, 'Facturación manual ejecutada exitosamente');
      } catch (error: any) {
        console.error('Error in manual billing:', error);
        return serverErrorResponse(`Error ejecutando facturación manual: ${error.message}`);
      }
    }

    // GET BILLING STATS
    if (path?.endsWith('/billing/stats') && httpMethod === 'GET') {
      console.log('=== GET BILLING STATS ===');
      
      try {
        const stats = await subscriptionRepository.getSubscriptionStats();
        
        // Obtener trials que vencen en 1, 7, y 30 días
        const expiring1Day = await subscriptionRepository.getTrialsExpiring(1);
        const expiring7Days = await subscriptionRepository.getTrialsExpiring(7);
        const expiring30Days = await subscriptionRepository.getTrialsExpiring(30);
        
        // Obtener suscripciones que necesitan reintento
        const needingRetry = await subscriptionRepository.getSubscriptionsForRetry();

        const billingStats = {
          ...stats,
          expiring: {
            in1Day: expiring1Day.length,
            in7Days: expiring7Days.length,
            in30Days: expiring30Days.length,
          },
          needingRetry: needingRetry.length,
          oneClickActive: stats.trialing + stats.active, // Aproximación
        };

        return successResponse(billingStats, 'Estadísticas de facturación obtenidas exitosamente');
      } catch (error: any) {
        console.error('Error getting billing stats:', error);
        return serverErrorResponse(`Error obteniendo estadísticas: ${error.message}`);
      }
    }

    // ============ NOTIFICATION TESTING ENDPOINTS ============

    // TEST EMAIL NOTIFICATION
    if (path?.endsWith('/notifications/test-email') && httpMethod === 'POST') {
      console.log('=== TEST EMAIL NOTIFICATION ===');
      
      const { email } = requestData;
      
      if (!email) {
        return errorResponse('Email requerido', 400);
      }

      // Only allow owner role to test notifications
      if (currentUser.role !== 'owner') {
        return unauthorizedResponse('Solo los propietarios pueden probar notificaciones');
      }

      try {
        const result = await notificationService.sendTestNotification(email);
        
        return successResponse({
          success: result.success,
          messageId: result.messageId,
          error: result.error
        }, result.success ? 'Email de prueba enviado exitosamente' : 'Error enviando email de prueba');
      } catch (error: any) {
        console.error('Error sending test email:', error);
        return serverErrorResponse(`Error enviando email de prueba: ${error.message}`);
      }
    }

    // Route not found
    console.log('Route not found:', path, httpMethod);
    return errorResponse('Endpoint no encontrado', 404);

  } catch (error: any) {
    console.error('=== TRANSBANK HANDLER ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    // Handle known errors
    if (error.message.includes('No tienes permisos')) {
      return unauthorizedResponse(error.message);
    }
    
    if (error.message.includes('no encontrado') || error.message.includes('no encontrada')) {
      return errorResponse(error.message, 404);
    }
    
    if (error.message.includes('Token')) {
      return unauthorizedResponse(error.message);
    }

    if (error.message.includes('requerido')) {
      return errorResponse(error.message, 400);
    }

    // Generic server error
    return serverErrorResponse(`Error interno del servidor: ${error.message}`);
  }
};

export const handler = withMetrics(transbankHandler, { trackUser: true });