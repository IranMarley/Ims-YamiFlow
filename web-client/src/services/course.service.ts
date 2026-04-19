import { publicApi } from '../lib/publicApi'
import type { Course, CourseListParams, PagedResult } from '../types/course'

const LEVEL_MAP: Record<number, string> = { 0: 'Beginner', 1: 'Intermediate', 2: 'Advanced' }
const STATUS_MAP: Record<number, string> = { 0: 'Draft', 1: 'Published', 2: 'Archived' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCourse(raw: any): Course {
  return {
    ...raw,
    level: LEVEL_MAP[raw.level as number] ?? raw.level,
    status: STATUS_MAP[raw.status as number] ?? raw.status,
  }
}

export const courseService = {
  async listCourses(params: CourseListParams = {}): Promise<PagedResult<Course>> {
    const response = await publicApi.get<PagedResult<Course>>('/api/courses', { params })
    return {
      ...response.data,
      items: response.data.items.map(normalizeCourse),
    }
  },

  async getCourse(id: string): Promise<Course> {
    const response = await publicApi.get<Course>(`/api/courses/${id}`)
    return normalizeCourse(response.data)
  },
}
