import { api } from '../lib/axios'

export interface ReviewItem {
  reviewId: string
  studentName: string
  rating: number
  comment: string
  createdAt: string
}

export interface ReviewResponse {
  reviewId: string
  courseId: string
  studentId: string
  rating: number
  comment: string
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

export const reviewService = {
  async listCourseReviews(
    courseId: string,
    page = 1,
    pageSize = 10,
  ): Promise<PagedResult<ReviewItem>> {
    const response = await api.get<PagedResult<ReviewItem>>(
      `/api/courses/${courseId}/reviews`,
      { params: { page, pageSize } },
    )
    return response.data
  },

  async createReview(
    courseId: string,
    data: { rating: number; comment: string },
  ): Promise<ReviewResponse> {
    const response = await api.post<ReviewResponse>(`/api/courses/${courseId}/reviews`, data)
    return response.data
  },

  async updateReview(
    courseId: string,
    reviewId: string,
    data: { rating: number; comment: string },
  ): Promise<void> {
    await api.put(`/api/courses/${courseId}/reviews/${reviewId}`, data)
  },

  async deleteReview(courseId: string, reviewId: string): Promise<void> {
    await api.delete(`/api/courses/${courseId}/reviews/${reviewId}`)
  },
}
