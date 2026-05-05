import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminService } from '../services/admin.service'

export const adminKeys = {
  stats: ['admin', 'stats'] as const,
  users: (params?: { search?: string; page?: number; pageSize?: number }) =>
    ['admin', 'users', params?.search ?? '', params?.page ?? 1, params?.pageSize ?? 20] as const,
  subscriptionPlans: ['admin', 'subscription-plans'] as const,
  instructors: ['admin', 'instructors'] as const,
  courses: (params?: { search?: string; instructorId?: string; status?: number; page?: number; pageSize?: number }) =>
    ['admin', 'courses', params?.search ?? '', params?.instructorId ?? '', params?.status ?? -1, params?.page ?? 1, params?.pageSize ?? 20] as const,
  auditLogs: (params?: { entityName?: string; userName?: string; dateFrom?: string; dateTo?: string; sortAsc?: boolean; page?: number; pageSize?: number }) =>
    ['admin', 'audit-logs', params?.entityName ?? '', params?.userName ?? '', params?.dateFrom ?? '', params?.dateTo ?? '', params?.sortAsc ?? false, params?.page ?? 1, params?.pageSize ?? 50] as const,
  authLogs: (params?: { email?: string; success?: boolean; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number }) =>
    ['admin', 'auth-logs', params?.email ?? '', params?.success ?? null, params?.dateFrom ?? '', params?.dateTo ?? '', params?.page ?? 1, params?.pageSize ?? 50] as const,
}

export function useAdminStats() {
  return useQuery<any, Error>({
    queryKey: adminKeys.stats,
    queryFn: () => adminService.getStats(),
  })
}

export function useAdminUsers(params: { search?: string; page?: number; pageSize?: number } = {}) {
  return useQuery<any, Error>({
    queryKey: adminKeys.users(params),
    queryFn: () => adminService.listUsers(params),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation<{ userId: string }, Error, { email: string; fullName: string; password: string; role: string }>({
    mutationFn: (data) => adminService.createUser(data),
    onError: (err) => toast.error((err as any)?.response?.data || (err as Error)?.message || 'Failed to create user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User created.')
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation<any, Error, { userId: string; fullName: string; role: string }>({
    mutationFn: ({ userId, fullName, role }) => adminService.updateUser(userId, { fullName, role }),
    onError: (err) => toast.error((err as Error)?.message || 'Failed to update user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User updated.')
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation<any, Error, { userId: string; isActive: boolean }>({
    mutationFn: ({ userId, isActive }) => adminService.toggleUserStatus(userId, isActive),
    onError: (err) => toast.error((err as Error)?.message || 'Failed to toggle user status'),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success(vars.isActive ? 'User activated.' : 'User deactivated.')
    },
  })
}

export function useConfirmUserEmail() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (userId: string) => adminService.confirmUserEmail(userId),
    onError: (err) => toast.error((err as Error)?.message || 'Failed to confirm email'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Email confirmed.')
    },
  })
}

export function useRevokeUserTokens() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (userId: string) => adminService.revokeUserTokens(userId),
    onError: (err) => toast.error((err as Error)?.message || 'Failed to revoke tokens'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User tokens revoked.')
    },
  })
}

export function useAdminSubscriptionPlans() {
  return useQuery<any[], Error>({
    queryKey: adminKeys.subscriptionPlans,
    queryFn: () => adminService.getSubscriptionPlans(),
  })
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { planId: string; name: string; description: string; amount: number; sortOrder: number; stripeProductId?: string; stripePriceId?: string }
  >({
    mutationFn: ({ planId, ...data }) => adminService.updateSubscriptionPlan(planId, data),
    onError: (err) => toast.error((err as Error)?.message || 'Failed to update plan'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.subscriptionPlans })
      toast.success('Plan updated.')
    },
  })
}

export function useAdminInstructors() {
  return useQuery<any[], Error>({
    queryKey: adminKeys.instructors,
    queryFn: () => adminService.getInstructors(),
  })
}

export function useAdminCourses(params: {
  search?: string
  instructorId?: string
  status?: number
  page?: number
  pageSize?: number
} = {}) {
  return useQuery<any, Error>({
    queryKey: adminKeys.courses(params),
    queryFn: () => adminService.getCourses(params),
  })
}

export function useSetCourseStatus() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { courseId: string; status: number }>({
    mutationFn: ({ courseId, status }) => adminService.setCourseStatus(courseId, status),
    onError: (err) => toast.error((err as Error)?.message || 'Failed to update status'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] })
      toast.success('Course status updated.')
    },
  })
}

export function useAdminAuditLogs(params: {
  entityName?: string
  userName?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortAsc?: boolean
} = {}) {
  return useQuery<any, Error>({
    queryKey: adminKeys.auditLogs(params),
    queryFn: () => adminService.getAuditLogs(params),
  })
}

export function useAdminAuthLogs(params: {
  email?: string
  success?: boolean
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
} = {}) {
  return useQuery<any, Error>({
    queryKey: adminKeys.authLogs(params),
    queryFn: () => adminService.getAuthLogs(params),
  })
}
