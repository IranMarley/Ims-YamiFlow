export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  amount: number
  currency: string
  interval: string
  intervalCount: number
  trialDays: number | null
  stripePriceId: string
}

export interface SubscribeResponse {
  subscriptionId: string
  stripeSubscriptionId: string
  status: string
  clientSecret: string | null
  publishableKey: string | null
}

export interface SubscriptionDetail {
  subscriptionId: string
  planId: string
  planName: string
  amount: number
  currency: string
  interval: string
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  trialEnd: string | null
  grantsAccess: boolean
  /** Alias for grantsAccess — convenience flag used by view components */
  isActive: boolean
}
