import { api } from '../lib/axios'

export interface AdminStatsResponse {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  totalRevenue: number
}

export interface UserItem {
  userId: string
  email: string
  fullName: string
  isActive: boolean
  emailConfirmed: boolean
  createdAt: string
  roles: string[]
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface SubscriptionPlanAdminItem {
  id: string
  name: string
  description: string
  stripePriceId: string
  amount: number
  currency: string
  interval: string
  isActive: boolean
  sortOrder: number
}

export interface AuditLogItem {
  id: number
  source: string
  entityName: string | null
  action: string | null
  userId: string | null
  userName: string | null
  ipAddress: string | null
  createdAt: string
}

export interface AuthLogItem {
  id: number
  eventType: string
  userId: string | null
  email: string | null
  success: boolean
  failureReason: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface InstructorItem {
  userId: string
  fullName: string
}

export interface AdminCourseItem {
  courseId: string
  title: string
  slug: string
  isFree: boolean
  status: number
  level: number
  instructorId: string
  instructorName: string | null
  enrollmentCount: number
  createdAt: string
  publishedAt: string | null
}

export const adminService = {
  async getStats(): Promise<AdminStatsResponse> {
    const response = await api.get<AdminStatsResponse>('/api/admin/stats')
    return response.data
  },

  async listUsers(params: { search?: string; page?: number; pageSize?: number } = {}): Promise<PagedResult<UserItem>> {
    const response = await api.get<PagedResult<UserItem>>('/api/admin/users', { params })
    return response.data
  },

  async createUser(data: { email: string; fullName: string; password: string; role: string }): Promise<{ userId: string }> {
    const response = await api.post<{ userId: string }>('/api/admin/users', data)
    return response.data
  },

  async updateUser(userId: string, data: { fullName: string; role: string }): Promise<void> {
    await api.put(`/api/admin/users/${userId}`, data)
  },

  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    await api.post(`/api/admin/users/${userId}/toggle-status`, { isActive })
  },

  async confirmUserEmail(userId: string): Promise<void> {
    await api.post(`/api/admin/users/${userId}/confirm-email`)
  },

  async getSubscriptionPlans(): Promise<SubscriptionPlanAdminItem[]> {
    const response = await api.get<SubscriptionPlanAdminItem[]>('/api/admin/subscription-plans')
    return response.data
  },

  async updateSubscriptionPlan(
    planId: string,
    data: { name: string; description: string; amount: number; sortOrder: number }
  ): Promise<void> {
    await api.put(`/api/admin/subscription-plans/${planId}`, data)
  },

  async getInstructors(): Promise<InstructorItem[]> {
    const response = await api.get<InstructorItem[]>('/api/admin/instructors')
    return response.data
  },

  async getCourses(params: {
    search?: string
    instructorId?: string
    status?: number
    page?: number
    pageSize?: number
  } = {}): Promise<PagedResult<AdminCourseItem>> {
    const response = await api.get<PagedResult<AdminCourseItem>>('/api/admin/courses', { params })
    return response.data
  },

  async setCourseStatus(courseId: string, status: number): Promise<void> {
    await api.put(`/api/admin/courses/${courseId}/status`, { status })
  },

  async getAuditLogs(params: {
    entityName?: string
    userName?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    pageSize?: number
    sortAsc?: boolean
  } = {}): Promise<PagedResult<AuditLogItem>> {
    const response = await api.get<PagedResult<AuditLogItem>>('/api/admin/audit-logs', { params })
    return response.data
  },

  async getAuthLogs(params: {
    email?: string
    success?: boolean
    dateFrom?: string
    dateTo?: string
    page?: number
    pageSize?: number
  } = {}): Promise<PagedResult<AuthLogItem>> {
    const response = await api.get<PagedResult<AuthLogItem>>('/api/admin/auth-logs', { params })
    return response.data
  },
}
