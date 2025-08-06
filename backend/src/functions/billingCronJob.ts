import { ScheduledEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { billingService } from '../services/billingService';
import { notificationService } from '../services/notificationService';
import { withMetrics } from '../middleware/requestMetrics';

/**
 * Cron job para procesar facturación diaria
 * Se ejecuta todos los días a las 9:00 AM UTC (6:00 AM Chile)
 * 
 * EventBridge Rule: cron(0 9 * * ? *)
 */
const billingCronHandler = async (
  event: ScheduledEvent, 
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('=== BILLING CRON JOB STARTED ===');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  const startTime = Date.now();

  try {
    // Ejecutar proceso de facturación diaria
    const results = await billingService.runDailyBilling();

    // Log detallado de resultados
    console.log('=== BILLING RESULTS ===');
    console.log(`Trial notifications sent: ${results.trialNotifications.length}`);
    console.log(`Charges - Processed: ${results.chargeResults.processed}, Successful: ${results.chargeResults.successful}, Failed: ${results.chargeResults.failed}`);
    console.log(`Retries - Processed: ${results.retryResults.processed}, Successful: ${results.retryResults.successful}, Failed: ${results.retryResults.failed}`);
    console.log(`Total notifications: ${results.totalNotifications}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log(`Alerts - Generated: ${results.alerts.length}, Sent: ${results.alertResults.sent}, Failed: ${results.alertResults.failed}`);

    if (results.errors.length > 0) {
      console.log('Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Enviar notificaciones por email
    console.log(`Sending ${results.trialNotifications.length} email notifications...`);
    const emailResults = await notificationService.sendBillingNotifications(results.trialNotifications);
    console.log(`Email notifications - Sent: ${emailResults.sent}, Failed: ${emailResults.failed}`);

    const duration = Date.now() - startTime;
    console.log(`=== BILLING CRON JOB COMPLETED in ${duration}ms ===`);

    // Respuesta exitosa
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Daily billing process completed successfully',
        duration: `${duration}ms`,
        results: {
          trialNotifications: results.trialNotifications.length,
          chargeResults: results.chargeResults,
          retryResults: results.retryResults,
          totalNotifications: results.totalNotifications,
          errorsCount: results.errors.length,
          alertsGenerated: results.alerts.length,
          alertsSent: results.alertResults.sent,
          alertsFailed: results.alertResults.failed,
          emailsSent: emailResults.sent,
          emailsFailed: emailResults.failed,
        },
        timestamp: new Date().toISOString(),
      })
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('=== BILLING CRON JOB FAILED ===');
    console.error('Error:', error);
    console.error('Duration:', `${duration}ms`);

    // TODO: Enviar alerta crítica
    // await alertService.sendCriticalAlert('Billing cron job failed', error);

    // Respuesta de error
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        message: 'Daily billing process failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      })
    };
  }
};

/**
 * Handler para testing manual del cron job
 * Endpoint: POST /billing/run-daily
 */
const manualBillingHandler = async (): Promise<APIGatewayProxyResult> => {
  console.log('=== MANUAL BILLING TRIGGERED ===');

  try {
    // Crear un evento simulado para el cron
    const mockEvent: ScheduledEvent = {
      version: '0',
      id: 'manual-trigger',
      'detail-type': 'Manual Trigger',
      source: 'manual',
      account: 'manual',
      time: new Date().toISOString(),
      region: 'us-east-1',
      detail: {},
      resources: []
    };

    const mockContext: Context = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'manual-billing',
      functionVersion: '1',
      invokedFunctionArn: 'manual',
      memoryLimitInMB: '512',
      awsRequestId: 'manual-' + Date.now(),
      logGroupName: 'manual',
      logStreamName: 'manual',
      getRemainingTimeInMillis: () => 300000, // 5 minutes
      done: () => {},
      fail: () => {},
      succeed: () => {}
    };

    // Ejecutar el cron job
    const result = await billingCronHandler(mockEvent, mockContext);

    return result;
  } catch (error) {
    console.error('Manual billing failed:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        message: 'Manual billing process failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    };
  }
};

// Export both handlers
export const cronHandler = withMetrics(billingCronHandler, { trackUser: false });
export const manualHandler = withMetrics(manualBillingHandler, { trackUser: false });