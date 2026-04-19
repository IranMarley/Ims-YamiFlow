import { api } from '../lib/axios'

export interface InstructorStats {
  totalCourses: number
  totalStudents: number
  totalEnrollments: number
  totalRevenue: number
}

export interface InstructorCourse {
  courseId: string
  title: string
  slug: string
  description: string
  thumbnail: string | null
  price: number
  level: number
  instructorId: string
  enrollmentCount: number
  publishedAt: string | null
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

export const instructorService = {
  async getMyCourses(page = 1, pageSize = 12): Promise<PagedResult<InstructorCourse>> {
    const response = await api.get<PagedResult<InstructorCourse>>('/api/instructor/courses', {
      params: { page, pageSize },
    })
    return response.data
  },

  async getMyStats(): Promise<InstructorStats> {
    const response = await api.get<InstructorStats>('/api/instructor/stats')
    return response.data
  },
}
