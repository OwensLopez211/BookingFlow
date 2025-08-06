"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualHandler = exports.cronHandler = void 0;
const billingService_1 = require("../services/billingService");
const notificationService_1 = require("../services/notificationService");
const requestMetrics_1 = require("../middleware/requestMetrics");
/**
 * Cron job para procesar facturación diaria
 * Se ejecuta todos los días a las 9:00 AM UTC (6:00 AM Chile)
 *
 * EventBridge Rule: cron(0 9 * * ? *)
 */
const billingCronHandler = async (event, context) => {
    console.log('=== BILLING CRON JOB STARTED ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));
    const startTime = Date.now();
    try {
        // Ejecutar proceso de facturación diaria
        const results = await billingService_1.billingService.runDailyBilling();
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
        const emailResults = await notificationService_1.notificationService.sendBillingNotifications(results.trialNotifications);
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
    }
    catch (error) {
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
const manualBillingHandler = async () => {
    console.log('=== MANUAL BILLING TRIGGERED ===');
    try {
        // Crear un evento simulado para el cron
        const mockEvent = {
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
        const mockContext = {
            callbackWaitsForEmptyEventLoop: false,
            functionName: 'manual-billing',
            functionVersion: '1',
            invokedFunctionArn: 'manual',
            memoryLimitInMB: '512',
            awsRequestId: 'manual-' + Date.now(),
            logGroupName: 'manual',
            logStreamName: 'manual',
            getRemainingTimeInMillis: () => 300000, // 5 minutes
            done: () => { },
            fail: () => { },
            succeed: () => { }
        };
        // Ejecutar el cron job
        const result = await billingCronHandler(mockEvent, mockContext);
        return result;
    }
    catch (error) {
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
exports.cronHandler = (0, requestMetrics_1.withMetrics)(billingCronHandler, { trackUser: false });
exports.manualHandler = (0, requestMetrics_1.withMetrics)(manualBillingHandler, { trackUser: false });
