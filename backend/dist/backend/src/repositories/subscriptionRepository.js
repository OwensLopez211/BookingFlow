"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRepository = exports.SubscriptionRepository = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const uuid_1 = require("uuid");
const client = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.SUBSCRIPTIONS_TABLE || 'BookFlow-Subscriptions';
class SubscriptionRepository {
    /**
     * Crea una nueva suscripción
     */
    async createSubscription(data) {
        const now = new Date().toISOString();
        const subscription = {
            id: (0, uuid_1.v4)(),
            organizationId: data.organizationId,
            transbankOrderId: data.transbankOrderId,
            transbankTransactionId: data.transbankTransactionId,
            customerId: data.customerId,
            planId: data.planId,
            planName: data.planName,
            status: data.status,
            current_period_start: data.current_period_start,
            current_period_end: data.current_period_end,
            trial_start: data.trial_start,
            trial_end: data.trial_end,
            cancel_at_period_end: data.cancel_at_period_end || false,
            canceled_at: undefined,
            amount: data.amount,
            currency: data.currency,
            interval: data.interval,
            payment_method: data.payment_method,
            last_payment_date: data.last_payment_date,
            next_billing_date: data.next_billing_date,
            // OneClick specific fields
            oneclick_user_id: data.oneclick_user_id,
            oneclick_username: data.oneclick_username,
            oneclick_inscription_token: data.oneclick_inscription_token,
            oneclick_inscription_date: data.oneclick_inscription_date,
            oneclick_active: data.oneclick_active || false,
            payment_attempts: data.payment_attempts || 0,
            last_payment_attempt: data.last_payment_attempt,
            retry_payment_at: data.retry_payment_at,
            createdAt: now,
            updatedAt: now,
        };
        const command = new lib_dynamodb_1.PutCommand({
            TableName: TABLE_NAME,
            Item: subscription,
            ConditionExpression: 'attribute_not_exists(id)',
        });
        try {
            await docClient.send(command);
            console.log('Subscription created successfully:', subscription.id);
            return subscription;
        }
        catch (error) {
            console.error('Error creating subscription:', error);
            throw new Error('Failed to create subscription');
        }
    }
    /**
     * Obtiene una suscripción por ID
     */
    async getSubscriptionById(id) {
        const command = new lib_dynamodb_1.GetCommand({
            TableName: TABLE_NAME,
            Key: { id },
        });
        try {
            const result = await docClient.send(command);
            return result.Item || null;
        }
        catch (error) {
            console.error('Error getting subscription:', error);
            throw new Error('Failed to get subscription');
        }
    }
    /**
     * Obtiene una suscripción por Organization ID
     */
    async getByOrganizationId(organizationId) {
        const command = new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'OrganizationIdIndex', // GSI necesario
            KeyConditionExpression: 'organizationId = :orgId',
            ExpressionAttributeValues: {
                ':orgId': organizationId,
            },
            ScanIndexForward: false, // Obtener el más reciente primero
            Limit: 1,
        });
        try {
            const result = await docClient.send(command);
            const items = result.Items;
            return items.length > 0 ? items[0] : null;
        }
        catch (error) {
            console.error('Error getting subscription by organization:', error);
            throw new Error('Failed to get subscription by organization');
        }
    }
    /**
     * Obtiene una suscripción por Transbank Order ID
     */
    async getSubscriptionByTransbankOrderId(transbankOrderId) {
        const command = new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'TransbankOrderIdIndex', // GSI necesario
            KeyConditionExpression: 'transbankOrderId = :orderId',
            ExpressionAttributeValues: {
                ':orderId': transbankOrderId,
            },
            Limit: 1,
        });
        try {
            const result = await docClient.send(command);
            const items = result.Items;
            return items.length > 0 ? items[0] : null;
        }
        catch (error) {
            console.error('Error getting subscription by Transbank Order ID:', error);
            throw new Error('Failed to get subscription by Transbank Order ID');
        }
    }
    /**
     * Actualiza una suscripción
     */
    async updateSubscription(id, updates) {
        const now = new Date().toISOString();
        // Construir expression attributes dinámicamente
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = now;
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                updateExpressions.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = value;
            }
        });
        const command = new lib_dynamodb_1.UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
            ConditionExpression: 'attribute_exists(id)',
        });
        try {
            const result = await docClient.send(command);
            console.log('Subscription updated successfully:', id);
            return result.Attributes;
        }
        catch (error) {
            console.error('Error updating subscription:', error);
            throw new Error('Failed to update subscription');
        }
    }
    /**
     * Cancela una suscripción (soft delete)
     */
    async cancelSubscription(id) {
        return this.updateSubscription(id, {
            status: 'canceled',
            cancel_at_period_end: true,
            canceled_at: Date.now(),
        });
    }
    /**
     * Elimina una suscripción (hard delete)
     */
    async deleteSubscription(id) {
        const command = new lib_dynamodb_1.DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id },
            ConditionExpression: 'attribute_exists(id)',
        });
        try {
            await docClient.send(command);
            console.log('Subscription deleted successfully:', id);
        }
        catch (error) {
            console.error('Error deleting subscription:', error);
            throw new Error('Failed to delete subscription');
        }
    }
    /**
     * Lista todas las suscripciones activas que expiran en X días
     */
    async getExpiringSubscriptions(daysFromNow) {
        const targetTimestamp = Math.floor(Date.now() / 1000) + (daysFromNow * 24 * 60 * 60);
        const command = new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'StatusIndex', // GSI necesario
            KeyConditionExpression: '#status = :status',
            FilterExpression: 'current_period_end <= :targetTimestamp AND current_period_end > :now',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': 'active',
                ':targetTimestamp': targetTimestamp,
                ':now': Math.floor(Date.now() / 1000),
            },
        });
        try {
            const result = await docClient.send(command);
            return result.Items;
        }
        catch (error) {
            console.error('Error getting expiring subscriptions:', error);
            throw new Error('Failed to get expiring subscriptions');
        }
    }
    /**
     * Obtiene suscripciones que necesitan ser cobradas (trials que expiran)
     */
    async getTrialsExpiring(daysFromNow = 1) {
        const targetTimestamp = Math.floor(Date.now() / 1000) + (daysFromNow * 24 * 60 * 60);
        const nowTimestamp = Math.floor(Date.now() / 1000);
        const command = new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'StatusIndex', // GSI necesario
            KeyConditionExpression: '#status = :status',
            FilterExpression: 'trial_end <= :targetTimestamp AND trial_end > :now AND oneclick_active = :oneclickActive',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': 'trialing',
                ':targetTimestamp': targetTimestamp,
                ':now': nowTimestamp,
                ':oneclickActive': true,
            },
        });
        try {
            const result = await docClient.send(command);
            return result.Items;
        }
        catch (error) {
            console.error('Error getting expiring trials:', error);
            throw new Error('Failed to get expiring trials');
        }
    }
    /**
     * Obtiene suscripciones con pagos fallidos que necesitan reintento
     */
    async getSubscriptionsForRetry() {
        const nowTimestamp = Math.floor(Date.now() / 1000);
        const command = new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'StatusIndex', // GSI necesario
            KeyConditionExpression: '#status = :status',
            FilterExpression: 'retry_payment_at <= :now AND payment_attempts < :maxAttempts',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': 'past_due',
                ':now': nowTimestamp,
                ':maxAttempts': 3, // Máximo 3 intentos
            },
        });
        try {
            const result = await docClient.send(command);
            return result.Items;
        }
        catch (error) {
            console.error('Error getting subscriptions for retry:', error);
            throw new Error('Failed to get subscriptions for retry');
        }
    }
    /**
     * Actualiza el contador de intentos de pago
     */
    async updatePaymentAttempt(subscriptionId, success) {
        const nowTimestamp = Math.floor(Date.now() / 1000);
        if (success) {
            // Si el pago fue exitoso, resetear contadores y activar suscripción
            return this.updateSubscription(subscriptionId, {
                status: 'active',
                payment_attempts: 0,
                last_payment_attempt: nowTimestamp,
                retry_payment_at: undefined,
                last_payment_date: nowTimestamp,
                next_billing_date: nowTimestamp + (30 * 24 * 60 * 60), // Next billing in 30 days
            });
        }
        else {
            // Si falló, incrementar contador y programar reintento
            const subscription = await this.getSubscriptionById(subscriptionId);
            if (!subscription) {
                throw new Error('Subscription not found');
            }
            const newAttempts = subscription.payment_attempts + 1;
            const retryDelay = Math.pow(2, newAttempts) * 24 * 60 * 60; // Exponential backoff: 2, 4, 8 days
            return this.updateSubscription(subscriptionId, {
                status: newAttempts >= 3 ? 'canceled' : 'past_due',
                payment_attempts: newAttempts,
                last_payment_attempt: nowTimestamp,
                retry_payment_at: newAttempts < 3 ? nowTimestamp + retryDelay : undefined,
                canceled_at: newAttempts >= 3 ? nowTimestamp : undefined,
            });
        }
    }
    /**
     * Obtiene estadísticas de suscripciones
     */
    async getSubscriptionStats() {
        // Esta implementación es básica. Para mejor performance,
        // considera usar DynamoDB Streams o una tabla de agregaciones
        const command = new lib_dynamodb_1.QueryCommand({
            TableName: TABLE_NAME,
            ProjectionExpression: '#status',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
        });
        try {
            const result = await docClient.send(command);
            const subscriptions = result.Items;
            const stats = {
                total: subscriptions.length,
                active: 0,
                trialing: 0,
                canceled: 0,
                past_due: 0,
            };
            subscriptions.forEach(sub => {
                if (sub.status) {
                    switch (sub.status) {
                        case 'active':
                            stats.active++;
                            break;
                        case 'trialing':
                            stats.trialing++;
                            break;
                        case 'canceled':
                            stats.canceled++;
                            break;
                        case 'past_due':
                            stats.past_due++;
                            break;
                    }
                }
            });
            return stats;
        }
        catch (error) {
            console.error('Error getting subscription stats:', error);
            throw new Error('Failed to get subscription stats');
        }
    }
}
exports.SubscriptionRepository = SubscriptionRepository;
exports.subscriptionRepository = new SubscriptionRepository();
