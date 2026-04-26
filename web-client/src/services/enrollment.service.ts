import { api } from '../lib/axios'
import type { Enrollment, EnrollmentProgress, CertificateResponse } from '../types/enrollment'
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

  async getProgress(enrollmentId: string): Promise<EnrollmentProgress> {
    const response = await api.get<EnrollmentProgress>(`/api/enrollments/${enrollmentId}/progress`)
    return response.data
  },

  async getCertificate(enrollmentId: string): Promise<CertificateResponse | null> {
    const response = await api.get<CertificateResponse | null>(
      `/api/enrollments/${enrollmentId}/certificate`,
      { validateStatus: (s) => s === 200 || s === 204 }
    )
    return response.status === 204 ? null : response.data
  },

  async issueCertificate(enrollmentId: string): Promise<CertificateResponse> {
    const response = await api.post<CertificateResponse>(`/api/enrollments/${enrollmentId}/certificate`)
    return response.data
  },
}
