import { api } from '../lib/axios'
import type { Enrollment } from '../types/enrollment'
import type { PagedResult } from '../types/course'

export const enrollmentService = {
  async enroll(courseId: string, couponCode?: string): Promise<Enrollment> {
    const response = await api.post<Enrollment>('/api/enrollments', {
      courseId,
      couponCode: couponCode ?? null,
    })
    return response.data
  },

  async getMyEnrollments(page = 1, pageSize = 10): Promise<PagedResult<Enrollment>> {
    const response = await api.get<PagedResult<Enrollment>>('/api/enrollments/my', {
      params: { page, pageSize },
    })
    return response.data
  },

  async cancelEnrollment(enrollmentId: string): Promise<void> {
    await api.post(`/api/enrollments/${enrollmentId}/cancel`)
  },

  async getMyCourseIds(): Promise<string[]> {
    const response = await api.get<string[]>('/api/enrollments/my/course-ids')
    return response.data
  },
}
