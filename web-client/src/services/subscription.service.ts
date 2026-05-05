import { api } from '../lib/axios'
import type {
  SubscriptionPlan,
  SubscribeResponse,
  SubscriptionDetail,
  SyncSubscriptionResponse,
} from '../types/subscription'

export const subscriptionService = {
  async listPlans(): Promise<SubscriptionPlan[]> {
    const { data } = await api.get<SubscriptionPlan[]>('/api/subscriptions/plans')
    return data
  },

  async getCurrent(): Promise<SubscriptionDetail | null> {
    const { data } = await api.get<SubscriptionDetail | null>('/api/subscriptions/current')
    return data
  },

  async subscribe(planId: string): Promise<SubscribeResponse> {
    const { data } = await api.post<SubscribeResponse>('/api/subscriptions/subscribe', { planId })
    return data
  },

  async cancel(atPeriodEnd = true): Promise<void> {
    await api.post('/api/subscriptions/cancel', { atPeriodEnd })
  },

  async resume(): Promise<void> {
    await api.post('/api/subscriptions/resume')
  },

  async sync(): Promise<SyncSubscriptionResponse> {
    const { data } = await api.post<SyncSubscriptionResponse>('/api/subscriptions/sync')
    return data
  },
}
