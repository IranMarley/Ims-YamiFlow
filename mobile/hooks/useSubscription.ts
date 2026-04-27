import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionService } from '../services/subscription.service'
import { useAuthStore } from '../store/authStore'

const subKeys = {
  all: ['subscriptions'] as const,
  plans: () => [...subKeys.all, 'plans'] as const,
  current: () => [...subKeys.all, 'current'] as const,
}

export function usePlans() {
  return useQuery({
    queryKey: subKeys.plans(),
    queryFn: () => subscriptionService.listPlans(),
    staleTime: 1000 * 60 * 10,
  })
}

export function useSubscription() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: subKeys.current(),
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
      queryClient.invalidateQueries({ queryKey: subKeys.all })
    },
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => subscriptionService.cancel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subKeys.all })
    },
  })
}

export function useResumeSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => subscriptionService.resume(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subKeys.all })
    },
  })
}
