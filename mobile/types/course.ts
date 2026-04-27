export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type CourseStatus = 'Draft' | 'Published' | 'Archived'

export interface LessonDetail {
  lessonId: string
  title: string
  order: number
  type: string
  durationSeconds: number
  contentUrl?: string
  isFreePreview: boolean
  hasVideo: boolean
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
  thumbnail?: string
  isFree: boolean
  level: CourseLevel | string
  status: CourseStatus | string
  instructorId: string
  instructorName?: string
  enrollmentCount?: number
  publishedAt?: string
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
  level?: string
  isFree?: boolean
}
