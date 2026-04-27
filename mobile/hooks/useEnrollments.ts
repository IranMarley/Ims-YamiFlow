import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enrollmentService } from '../services/enrollment.service'
import { useAuthStore } from '../store/authStore'

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  my: (page?: number) => [...enrollmentKeys.all, 'my', page ?? 1] as const,
  courseIds: () => [...enrollmentKeys.all, 'course-ids'] as const,
  progress: (enrollmentId: string) => [...enrollmentKeys.all, 'progress', enrollmentId] as const,
}

export function useMyEnrollments(page = 1) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: enrollmentKeys.my(page),
    queryFn: () => enrollmentService.getMyEnrollments(page),
    placeholderData: (prev) => prev,
    enabled: !!user,
  })
}

export function useEnroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, couponCode }: { courseId: string; couponCode?: string }) =>
      enrollmentService.enroll(courseId, couponCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    },
  })
}

export function useMyEnrolledCourseIds() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: enrollmentKeys.courseIds(),
    queryFn: () => enrollmentService.getMyCourseIds(),
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  })
}

export function useEnrollmentForCourse(courseId: string) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: [...enrollmentKeys.all, 'for-course', courseId] as const,
    queryFn: async () => {
      const result = await enrollmentService.getMyEnrollments(1, 100)
      return result.items.find((e) => e.courseId === courseId) ?? null
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!user && !!courseId,
  })
}

export function useEnrollmentProgress(enrollmentId: string | undefined) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: enrollmentKeys.progress(enrollmentId ?? ''),
    queryFn: () => enrollmentService.getProgress(enrollmentId!),
    staleTime: 1000 * 30,
    enabled: !!user && !!enrollmentId,
  })
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (enrollmentId: string) => enrollmentService.cancelEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    },
  })
}

export function useEnrollmentCertificate(enrollmentId: string | undefined) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: [...enrollmentKeys.all, 'certificate', enrollmentId] as const,
    queryFn: () => enrollmentService.getCertificate(enrollmentId!),
    enabled: !!user && !!enrollmentId,
    staleTime: Infinity,
  })
}

export function useIssueCertificate() {
  return useMutation({
    mutationFn: (enrollmentId: string) => enrollmentService.issueCertificate(enrollmentId),
  })
}

export function useCompleteLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ enrollmentId, lessonId }: { enrollmentId: string; lessonId: string }) =>
      enrollmentService.completeLesson(enrollmentId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    },
  })
}
