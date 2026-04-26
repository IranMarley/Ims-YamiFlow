export interface Enrollment {
  enrollmentId: string
  courseId: string
  courseTitle: string
  courseSlug: string
  courseThumbnail: string | null
  finalPrice?: number
  status: number
  completedLessons: number
  totalLessons: number
  progressPercent: number
  enrolledAt: string
  completedAt: string | null
}

export interface LessonProgressItem {
  lessonId: string
  lessonTitle: string
  completed: boolean
  watchedSeconds: number
  completedAt: string | null
}

export interface EnrollmentProgress {
  enrollmentId: string
  courseId: string
  courseTitle: string
  progressPercent: number
  completedLessons: number
  totalLessons: number
  lessons: LessonProgressItem[]
}

export interface CertificateResponse {
  certificateId: string
  code: string
  issuedAt: string
}
