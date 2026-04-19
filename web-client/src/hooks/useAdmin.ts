import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminService } from '../services/admin.service'

export const adminKeys = {
  stats: ['admin', 'stats'] as const,
  users: (params?: { search?: string; page?: number; pageSize?: number }) =>
    [
      'admin',
      'users',
      params?.search ?? '',
      params?.page ?? 1,
      params?.pageSize ?? 20,
    ] as const,
}

export function useAdminStats() {
  return useQuery<any, Error>({
    queryKey: adminKeys.stats,
    queryFn: () => adminService.getStats(),
  })
}

export function useAdminUsers(params: { search?: string; page?: number; pageSize?: number } = {}) {
  const key = adminKeys.users(params)
  return useQuery<any, Error>({
    queryKey: key,
    queryFn: () => adminService.listUsers(params),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation<any, Error, { userId: string; fullName: string; role: string }>({
    mutationFn: ({ userId, fullName, role }: { userId: string; fullName: string; role: string }) =>
      adminService.updateUser(userId, { fullName, role }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'users'] })
      const previous = queryClient.getQueryData(['admin', 'users'])
      return { previous }
    },
    onError: (err, _vars, context: any) => {
      if (context?.previous) queryClient.setQueryData(['admin', 'users'], context.previous)
      toast.error((err as Error)?.message || 'Failed to update user')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User updated.')
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation<any, Error, { userId: string; isActive: boolean }>({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminService.toggleUserStatus(userId, isActive),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'users'] })
      const previous = queryClient.getQueryData(['admin', 'users'])
      return { previous }
    },
    onError: (err, _vars, context: any) => {
      if (context?.previous) queryClient.setQueryData(['admin', 'users'], context.previous)
      toast.error((err as Error)?.message || 'Failed to toggle user status')
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success(vars.isActive ? 'User activated.' : 'User deactivated.')
    },
  })
}
