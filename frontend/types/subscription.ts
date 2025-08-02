export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  available: boolean;
  popular: boolean;
  trialDays?: number;
  transbankAmount?: number; // Amount in CLP for Transbank
  features: PlanFeature[];
}

export interface PlanSelection {
  planId: string;
  planName?: string;
  planPrice?: string;
  planPeriod?: string;
  transbankAmount?: number;
  trialDays?: number;
  requiresPayment: boolean;
}

export interface SubscriptionData {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  current_period_start: number;
  current_period_end: number;
  trial_start?: number;
  trial_end?: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  plan: {
    id: string;
    nickname: string;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    interval_count: number;
  };
  customer: {
    id: string;
    email: string;
  };
}

export interface BillingInfo {
  subscription?: SubscriptionData;
  nextBillingDate?: Date;
  trialEndsAt?: Date;
  canCancel: boolean;
  isInTrial: boolean;
  daysLeftInTrial?: number;
}