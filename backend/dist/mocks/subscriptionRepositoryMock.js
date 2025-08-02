"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockSubscriptionRepository = exports.MockSubscriptionRepository = void 0;
// Mock implementation of SubscriptionRepository for local development
const uuid_1 = require("uuid");
// In-memory storage for local development
let subscriptions = [];
class MockSubscriptionRepository {
    /**
     * Crea una nueva suscripción
     */
    async createSubscription(data) {
        const now = new Date().toISOString();
        const subscription = {
            id: (0, uuid_1.v4)(),
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
    async getSubscriptionById(id) {
        return subscriptions.find(sub => sub.id === id) || null;
    }
    /**
     * Obtiene una suscripción por Organization ID
     */
    async getSubscriptionByOrganizationId(organizationId) {
        return subscriptions.find(sub => sub.organizationId === organizationId) || null;
    }
    /**
     * Obtiene una suscripción por Stripe Subscription ID
     */
    async getSubscriptionByStripeId(stripeSubscriptionId) {
        return subscriptions.find(sub => sub.stripeSubscriptionId === stripeSubscriptionId) || null;
    }
    /**
     * Actualiza una suscripción
     */
    async updateSubscription(id, updates) {
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
    async getExpiringSubscriptions(daysFromNow) {
        const targetTimestamp = Math.floor(Date.now() / 1000) + (daysFromNow * 24 * 60 * 60);
        return subscriptions.filter(sub => sub.status === 'active' &&
            sub.current_period_end <= targetTimestamp &&
            sub.current_period_end > Math.floor(Date.now() / 1000));
    }
    /**
     * Obtiene estadísticas de suscripciones
     */
    async getSubscriptionStats() {
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
    async clearAll() {
        subscriptions.length = 0;
        console.log('📦 Mock: All subscriptions cleared');
    }
}
exports.MockSubscriptionRepository = MockSubscriptionRepository;
exports.mockSubscriptionRepository = new MockSubscriptionRepository();
