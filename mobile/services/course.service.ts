import { publicApi } from '../lib/publicApi'
import type { Course, PagedResult, CourseListParams } from '../types/course'

const LEVEL_MAP: Record<number, string> = { 0: 'Beginner', 1: 'Intermediate', 2: 'Advanced' }
const STATUS_MAP: Record<number, string> = { 0: 'Draft', 1: 'Published', 2: 'Archived' }

function normalizeCourse(raw: Course & { level: number | string; status: number | string }): Course {
  return {
    ...raw,
    level: typeof raw.level === 'number' ? (LEVEL_MAP[raw.level] ?? raw.level) : raw.level,
    status: typeof raw.status === 'number' ? (STATUS_MAP[raw.status] ?? raw.status) : raw.status,
  } as Course
}

export const courseService = {
  async listCourses(params: CourseListParams = {}): Promise<PagedResult<Course>> {
    const response = await publicApi.get<PagedResult<Course>>('/api/courses', { params })
    return { ...response.data, items: response.data.items.map(normalizeCourse) }
  },

  async getCourse(id: string): Promise<Course> {
    const response = await publicApi.get<Course>(`/api/courses/${id}`)
    return normalizeCourse(response.data as Course & { level: number | string; status: number | string })
  },
}
