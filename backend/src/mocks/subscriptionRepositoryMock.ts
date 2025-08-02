// Mock implementation of SubscriptionRepository for local development
import { v4 as uuidv4 } from 'uuid';

export interface Subscription {
  id: string;
  organizationId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionData {
  organizationId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
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
}

// In-memory storage for local development
let subscriptions: Subscription[] = [];

export class MockSubscriptionRepository {
  /**
   * Crea una nueva suscripción
   */
  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    const now = new Date().toISOString();
    const subscription: Subscription = {
      id: uuidv4(),
      organizationId: data.organizationId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripeCustomerId: data.stripeCustomerId,
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
      createdAt: now,
      updatedAt: now,
    };

    subscriptions.push(subscription);
    console.log('📦 Mock: Subscription created successfully:', subscription.id);
    return subscription;
  }

  /**
   * Obtiene una suscripción por ID
   */
  async getSubscriptionById(id: string): Promise<Subscription | null> {
    return subscriptions.find(sub => sub.id === id) || null;
  }

  /**
   * Obtiene una suscripción por Organization ID
   */
  async getSubscriptionByOrganizationId(organizationId: string): Promise<Subscription | null> {
    return subscriptions.find(sub => sub.organizationId === organizationId) || null;
  }

  /**
   * Obtiene una suscripción por Stripe Subscription ID
   */
  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    return subscriptions.find(sub => sub.stripeSubscriptionId === stripeSubscriptionId) || null;
  }

  /**
   * Actualiza una suscripción
   */
  async updateSubscription(id: string, updates: UpdateSubscriptionData): Promise<Subscription> {
    const index = subscriptions.findIndex(sub => sub.id === id);
    if (index === -1) {
      throw new Error('Subscription not found');
    }

    const now = new Date().toISOString();
    subscriptions[index] = {
      ...subscriptions[index],
      ...updates,
      updatedAt: now,
    };

    console.log('📦 Mock: Subscription updated successfully:', id);
    return subscriptions[index];
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
    const index = subscriptions.findIndex(sub => sub.id === id);
    if (index === -1) {
      throw new Error('Subscription not found');
    }

    subscriptions.splice(index, 1);
    console.log('📦 Mock: Subscription deleted successfully:', id);
  }

  /**
   * Lista todas las suscripciones activas que expiran en X días
   */
  async getExpiringSubscriptions(daysFromNow: number): Promise<Subscription[]> {
    const targetTimestamp = Math.floor(Date.now() / 1000) + (daysFromNow * 24 * 60 * 60);
    
    return subscriptions.filter(sub => 
      sub.status === 'active' &&
      sub.current_period_end <= targetTimestamp &&
      sub.current_period_end > Math.floor(Date.now() / 1000)
    );
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
    const stats = {
      total: subscriptions.length,
      active: 0,
      trialing: 0,
      canceled: 0,
      past_due: 0,
    };

    subscriptions.forEach(sub => {
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
    });

    return stats;
  }

  /**
   * Clear all subscriptions (for testing)
   */
  async clearAll(): Promise<void> {
    subscriptions.length = 0;
    console.log('📦 Mock: All subscriptions cleared');
  }
}

export const mockSubscriptionRepository = new MockSubscriptionRepository();