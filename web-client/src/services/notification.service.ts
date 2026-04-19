import { api } from '../lib/axios'

export interface NotificationItem {
  notificationId: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
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

export const notificationService = {
  async listNotifications(page = 1, pageSize = 20): Promise<PagedResult<NotificationItem>> {
    const response = await api.get<PagedResult<NotificationItem>>('/api/notifications', {
      params: { page, pageSize },
    })
    return response.data
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.post(`/api/notifications/${notificationId}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/api/notifications/read-all')
  },
}
