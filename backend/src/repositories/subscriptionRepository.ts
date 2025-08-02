import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.SUBSCRIPTIONS_TABLE || 'BookFlow-Subscriptions';

export interface Subscription {
  id: string;
  organizationId: string;
  transbankOrderId?: string;
  transbankTransactionId?: string;
  customerId: string;
  planId: string;
  planName: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  current_period_start: number;
  current_period_end: number;
  trial_start?: number;
  trial_end?: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  payment_method: 'transbank' | 'manual';
  last_payment_date?: number;
  next_billing_date?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionData {
  organizationId: string;
  transbankOrderId?: string;
  transbankTransactionId?: string;
  customerId: string;
  planId: string;
  planName: string;
  status: Subscription['status'];
  current_period_start: number;
  current_period_end: number;
  trial_start?: number;
  trial_end?: number;
  cancel_at_period_end?: boolean;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  payment_method: 'transbank' | 'manual';
  last_payment_date?: number;
  next_billing_date?: number;
}

export interface UpdateSubscriptionData {
  status?: Subscription['status'];
  current_period_start?: number;
  current_period_end?: number;
  trial_start?: number;
  trial_end?: number;
  cancel_at_period_end?: boolean;
  canceled_at?: number;
  amount?: number;
  currency?: string;
  interval?: 'month' | 'year';
  transbankOrderId?: string;
  transbankTransactionId?: string;
  payment_method?: 'transbank' | 'manual';
  last_payment_date?: number;
  next_billing_date?: number;
}

export class SubscriptionRepository {
  /**
   * Crea una nueva suscripción
   */
  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    const now = new Date().toISOString();
    const subscription: Subscription = {
      id: uuidv4(),
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
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: subscription,
      ConditionExpression: 'attribute_not_exists(id)',
    });

    try {
      await docClient.send(command);
      console.log('Subscription created successfully:', subscription.id);
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Obtiene una suscripción por ID
   */
  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });

    try {
      const result = await docClient.send(command);
      return result.Item as Subscription || null;
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw new Error('Failed to get subscription');
    }
  }

  /**
   * Obtiene una suscripción por Organization ID
   */
  async getSubscriptionByOrganizationId(organizationId: string): Promise<Subscription | null> {
    const command = new QueryCommand({
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
      const items = result.Items as Subscription[];
      return items.length > 0 ? items[0] : null;
    } catch (error) {
      console.error('Error getting subscription by organization:', error);
      throw new Error('Failed to get subscription by organization');
    }
  }

  /**
   * Obtiene una suscripción por Transbank Order ID
   */
  async getSubscriptionByTransbankOrderId(transbankOrderId: string): Promise<Subscription | null> {
    const command = new QueryCommand({
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
      const items = result.Items as Subscription[];
      return items.length > 0 ? items[0] : null;
    } catch (error) {
      console.error('Error getting subscription by Transbank Order ID:', error);
      throw new Error('Failed to get subscription by Transbank Order ID');
    }
  }

  /**
   * Actualiza una suscripción
   */
  async updateSubscription(id: string, updates: UpdateSubscriptionData): Promise<Subscription> {
    const now = new Date().toISOString();
    
    // Construir expression attributes dinámicamente
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

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

    const command = new UpdateCommand({
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
      return result.Attributes as Subscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Cancela una suscripción (soft delete)
   */
  async cancelSubscription(id: string): Promise<Subscription> {
    return this.updateSubscription(id, {
      status: 'canceled',
      cancel_at_period_end: true,
      canceled_at: Date.now(),
    });
  }

  /**
   * Elimina una suscripción (hard delete)
   */
  async deleteSubscription(id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
      ConditionExpression: 'attribute_exists(id)',
    });

    try {
      await docClient.send(command);
      console.log('Subscription deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw new Error('Failed to delete subscription');
    }
  }

  /**
   * Lista todas las suscripciones activas que expiran en X días
   */
  async getExpiringSubscriptions(daysFromNow: number): Promise<Subscription[]> {
    const targetTimestamp = Math.floor(Date.now() / 1000) + (daysFromNow * 24 * 60 * 60);
    
    const command = new QueryCommand({
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
      return result.Items as Subscription[];
    } catch (error) {
      console.error('Error getting expiring subscriptions:', error);
      throw new Error('Failed to get expiring subscriptions');
    }
  }

  /**
   * Obtiene estadísticas de suscripciones
   */
  async getSubscriptionStats(): Promise<{
    total: number;
    active: number;
    trialing: number;
    canceled: number;
    past_due: number;
  }> {
    // Esta implementación es básica. Para mejor performance,
    // considera usar DynamoDB Streams o una tabla de agregaciones
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      ProjectionExpression: '#status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
    });

    try {
      const result = await docClient.send(command);
      const subscriptions = result.Items as Partial<Subscription>[];
      
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
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      throw new Error('Failed to get subscription stats');
    }
  }
}

export const subscriptionRepository = new SubscriptionRepository();