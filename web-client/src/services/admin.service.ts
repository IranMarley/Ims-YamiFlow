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

export const adminService = {
  async getStats(): Promise<AdminStatsResponse> {
    const response = await api.get<AdminStatsResponse>('/api/admin/stats')
    return response.data
  },

  async listUsers(params: {
    search?: string
    page?: number
    pageSize?: number
  } = {}): Promise<PagedResult<UserItem>> {
    const response = await api.get<PagedResult<UserItem>>('/api/admin/users', { params })
    return response.data
  },

  async updateUser(userId: string, data: { fullName: string; role: string }): Promise<void> {
    await api.put(`/api/admin/users/${userId}`, data)
  },

  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    await api.post(`/api/admin/users/${userId}/toggle-status`, { isActive })
  },
}
