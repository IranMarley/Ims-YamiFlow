'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionService } from '../services/subscription.service'
import { useAuthStore } from '../store/authStore'

export const subscriptionKeys = {
  current: ['subscription', 'current'] as const,
  plans: ['subscription', 'plans'] as const,
}

export function usePlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans,
    queryFn: () => subscriptionService.listPlans(),
  })
}

export function useSubscription() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: subscriptionKeys.current,
    queryFn: () => subscriptionService.getCurrent(),
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  })
}

export function useSubscribe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (planId: string) => subscriptionService.subscribe(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current })
    },
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (atPeriodEnd: boolean = true) => subscriptionService.cancel(atPeriodEnd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current })
    },
  })
}

export function useResumeSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => subscriptionService.resume(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current })
    },
  })
}
