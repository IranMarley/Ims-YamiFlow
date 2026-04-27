export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  amount: number
  currency: string
  interval: string
  intervalCount: number
  trialDays?: number
  stripePriceId: string
}

export interface SubscribeResponse {
  subscriptionId: string
  stripeSubscriptionId: string
  status: string
  clientSecret?: string
  publishableKey?: string
}

export interface SubscriptionDetail {
  subscriptionId: string
  planId: string
  planName: string
  amount: number
  currency: string
  interval: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd?: string
  grantsAccess: boolean
}
