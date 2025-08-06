"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertService = exports.AlertService = void 0;
class AlertService {
    constructor() {
        this.thresholds = {
            maxFailureRate: 20, // 20% de fallos
            maxConsecutiveFailures: 5,
            criticalErrorPatterns: [
                'insufficient_funds',
                'card_expired',
                'card_blocked',
                'fraud_suspected'
            ]
        };
    }
    /**
     * Analiza los resultados de facturación y genera alertas críticas
     */
    async analyzeAndGenerateAlerts(chargeResults, retryResults, notifications, errors) {
        console.log('=== ANALYZING BILLING RESULTS FOR ALERTS ===');
        const alerts = [];
        try {
            // 1. Analizar tasa de fallos en cobros principales
            if (chargeResults.processed > 0) {
                const failureRate = (chargeResults.failed / chargeResults.processed) * 100;
                if (failureRate > this.thresholds.maxFailureRate) {
                    alerts.push({
                        type: 'high_failure_rate',
                        severity: failureRate > 50 ? 'critical' : 'high',
                        title: 'Alta tasa de fallos en cobros',
                        message: `La tasa de fallos en cobros es del ${failureRate.toFixed(1)}% (${chargeResults.failed}/${chargeResults.processed})`,
                        data: {
                            failureRate,
                            processed: chargeResults.processed,
                            failed: chargeResults.failed,
                            threshold: this.thresholds.maxFailureRate
                        },
                        timestamp: Math.floor(Date.now() / 1000)
                    });
                }
            }
            // 2. Analizar fallos en reintentos
            if (retryResults.processed > 0) {
                const retryFailureRate = (retryResults.failed / retryResults.processed) * 100;
                if (retryFailureRate > this.thresholds.maxFailureRate) {
                    alerts.push({
                        type: 'high_failure_rate',
                        severity: 'high',
                        title: 'Alta tasa de fallos en reintentos',
                        message: `La tasa de fallos en reintentos es del ${retryFailureRate.toFixed(1)}% (${retryResults.failed}/${retryResults.processed})`,
                        data: {
                            failureRate: retryFailureRate,
                            processed: retryResults.processed,
                            failed: retryResults.failed,
                            type: 'retry'
                        },
                        timestamp: Math.floor(Date.now() / 1000)
                    });
                }
            }
            // 3. Analizar errores críticos
            const criticalErrors = errors.filter(error => this.thresholds.criticalErrorPatterns.some(pattern => error.toLowerCase().includes(pattern)));
            if (criticalErrors.length > 0) {
                alerts.push({
                    type: 'billing_failure',
                    severity: 'critical',
                    title: 'Errores críticos detectados',
                    message: `Se detectaron ${criticalErrors.length} errores críticos en el proceso de facturación`,
                    data: {
                        criticalErrors: criticalErrors.slice(0, 5), // Limitar a 5 errores
                        totalErrors: errors.length
                    },
                    timestamp: Math.floor(Date.now() / 1000)
                });
            }
            // 4. Analizar suscripciones canceladas
            const canceledSubscriptions = notifications.filter(n => n.type === 'subscription_canceled');
            if (canceledSubscriptions.length > 3) { // Más de 3 cancelaciones en un día
                alerts.push({
                    type: 'billing_failure',
                    severity: 'medium',
                    title: 'Múltiples suscripciones canceladas',
                    message: `${canceledSubscriptions.length} suscripciones fueron canceladas por fallos de pago`,
                    data: {
                        canceledCount: canceledSubscriptions.length,
                        organizationIds: canceledSubscriptions.map(n => n.organizationId).slice(0, 10)
                    },
                    timestamp: Math.floor(Date.now() / 1000)
                });
            }
            // 5. Analizar errores del sistema
            if (errors.length > 10) { // Más de 10 errores generales
                alerts.push({
                    type: 'system_error',
                    severity: 'high',
                    title: 'Alto número de errores del sistema',
                    message: `Se registraron ${errors.length} errores durante el proceso de facturación`,
                    data: {
                        errorCount: errors.length,
                        errorSample: errors.slice(0, 3)
                    },
                    timestamp: Math.floor(Date.now() / 1000)
                });
            }
            console.log(`Generated ${alerts.length} alerts from billing analysis`);
            return alerts;
        }
        catch (error) {
            console.error('Error analyzing billing results for alerts:', error);
            // Generar alerta sobre el error del análisis mismo
            return [{
                    type: 'system_error',
                    severity: 'critical',
                    title: 'Error en análisis de alertas',
                    message: `No se pudieron analizar los resultados de facturación: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    data: { error: error instanceof Error ? error.message : 'Unknown error' },
                    timestamp: Math.floor(Date.now() / 1000)
                }];
        }
    }
    /**
     * Envía una alerta crítica específica
     */
    async sendCriticalAlert(alert) {
        console.log('=== SENDING CRITICAL ALERT ===');
        console.log(`Type: ${alert.type}, Severity: ${alert.severity}`);
        console.log(`Title: ${alert.title}`);
        console.log(`Message: ${alert.message}`);
        console.log('Data:', JSON.stringify(alert.data, null, 2));
        try {
            // TODO: Implementar envío real de alertas
            // - Email a administradores
            // - Slack webhook
            // - SMS para alertas críticas
            // - Guardar en base de datos de alertas
            // Por ahora, solo logging
            if (alert.severity === 'critical') {
                console.log('🚨 CRITICAL ALERT - Immediate attention required!');
            }
            else if (alert.severity === 'high') {
                console.log('⚠️ HIGH PRIORITY ALERT');
            }
            else {
                console.log('📋 ALERT');
            }
            // Simulación de envío exitoso
            console.log('Alert sent successfully');
        }
        catch (error) {
            console.error('Failed to send alert:', error);
            throw new Error(`Failed to send critical alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Envía múltiples alertas
     */
    async sendAlerts(alerts) {
        console.log(`=== SENDING ${alerts.length} ALERTS ===`);
        const results = {
            sent: 0,
            failed: 0,
            errors: []
        };
        for (const alert of alerts) {
            try {
                await this.sendCriticalAlert(alert);
                results.sent++;
            }
            catch (error) {
                results.failed++;
                const errorMsg = `Failed to send ${alert.type} alert: ${error instanceof Error ? error.message : 'Unknown error'}`;
                results.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }
        console.log(`Alerts sent: ${results.sent}, failed: ${results.failed}`);
        return results;
    }
    /**
     * Verifica si una organización tiene demasiados fallos consecutivos
     */
    async checkConsecutiveFailures(organizationId) {
        console.log(`Checking consecutive failures for organization: ${organizationId}`);
        try {
            // TODO: Implementar lógica para verificar fallos consecutivos
            // Esto requeriría mantener un historial de intentos de pago
            // Por ahora, retornar null (no implementado)
            return null;
        }
        catch (error) {
            console.error('Error checking consecutive failures:', error);
            return null;
        }
    }
    /**
     * Detecta patrones de fraude en fallos de pago
     */
    async detectFraudPatterns(notifications) {
        console.log('Analyzing payment failures for fraud patterns');
        const alerts = [];
        try {
            const failedPayments = notifications.filter(n => n.type === 'payment_failed');
            // Agrupar fallos por organización
            const failuresByOrg = failedPayments.reduce((acc, notification) => {
                if (!acc[notification.organizationId]) {
                    acc[notification.organizationId] = [];
                }
                acc[notification.organizationId].push(notification);
                return acc;
            }, {});
            // Detectar organizaciones con múltiples fallos en corto tiempo
            for (const [orgId, failures] of Object.entries(failuresByOrg)) {
                if (failures.length >= 3) { // 3 o más fallos en un día
                    alerts.push({
                        type: 'payment_fraud',
                        severity: 'high',
                        title: 'Posible patrón de fraude detectado',
                        message: `Organización ${orgId} tiene ${failures.length} fallos de pago en un día`,
                        data: {
                            organizationId: orgId,
                            failureCount: failures.length,
                            failures: failures.map(f => ({
                                timestamp: f.timestamp,
                                errorMessage: f.data.errorMessage
                            }))
                        },
                        timestamp: Math.floor(Date.now() / 1000),
                        organizationId: orgId
                    });
                }
            }
            return alerts;
        }
        catch (error) {
            console.error('Error detecting fraud patterns:', error);
            return [];
        }
    }
}
exports.AlertService = AlertService;
exports.alertService = new AlertService();
