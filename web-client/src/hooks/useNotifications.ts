import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../services/notification.service'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page: number) => [...notificationKeys.all, page] as const,
}

export function useNotifications(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: notificationKeys.list(page),
    queryFn: () => notificationService.listNotifications(page, pageSize),
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
