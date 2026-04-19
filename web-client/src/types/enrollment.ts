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
