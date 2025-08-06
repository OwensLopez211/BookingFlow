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
  // OneClick fields
  enableOneClick?: boolean;
  oneclickData?: OneClickInscriptionData;
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

// OneClick specific types
export interface OneClickInscriptionData {
  username: string;
  email: string;
  returnUrl: string;
}

export interface OneClickInscriptionResponse {
  token: string;
  urlWebpay: string;
  tbkUser?: string;
}

export interface OneClickFinishInscriptionData {
  token: string;
}

export interface OneClickFinishInscriptionResponse {
  success: boolean;
  tbkUser?: string;
  authorizationCode?: string;
  cardType?: string;
  cardNumber?: string;
}

export interface OneClickChargeData {
  username: string;
  tbkUser: string;
  buyOrder: string;
  amount: number;
}

export interface OneClickChargeResponse {
  success: boolean;
  authorizationCode?: string;
  buyOrder?: string;
  cardNumber?: string;
  amount?: number;
  transactionDate?: string;
  installmentsNumber?: number;
}

// Enhanced subscription status with OneClick fields
export interface SubscriptionStatus {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  current_period_end: number;
  trial_end?: number;
  plan: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    interval: string;
  };
  // OneClick specific fields
  oneclick_active?: boolean;
  oneclick_user_id?: string;
  payment_attempts?: number;
  last_payment_date?: number;
  next_billing_date?: number;
}

export interface PaymentAttempt {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  attemptNumber: number;
  errorMessage?: string;
  transactionId?: string;
  createdAt: string;
}

// Frontend form types for OneClick setup
export interface PaymentMethodFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

export interface OneClickSetupFormData {
  email: string;
  acceptTerms: boolean;
}

// Notification types for payment events
export interface PaymentNotification {
  type: 'payment_success' | 'payment_failed' | 'trial_ending' | 'subscription_canceled';
  title: string;
  message: string;
  timestamp: number;
  data?: Record<string, any>;
}