export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type CourseStatus = 'Draft' | 'Published' | 'Archived'

export interface LessonDetail {
  lessonId: string
  title: string
  order: number
  type: number
  durationSeconds: number
  contentUrl: string | null
  isFreePreview: boolean
}

export interface ModuleDetail {
  moduleId: string
  title: string
  order: number
  lessons: LessonDetail[]
}

export interface Course {
  courseId: string
  title: string
  slug: string
  description: string
  thumbnail?: string | null
  isFree: boolean
  level: CourseLevel
  status?: CourseStatus
  instructorId: string
  instructorName?: string | null
  enrollmentCount?: number
  publishedAt?: string | null
  modules?: ModuleDetail[]
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface CourseListParams {
  search?: string
  page?: number
  pageSize?: number
  level?: CourseLevel
  isFree?: boolean
}
