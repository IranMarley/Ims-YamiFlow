import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enrollmentService } from '../services/enrollment.service'
import { useAuthStore } from '../store/authStore'

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  my: (page?: number) => [...enrollmentKeys.all, 'my', page ?? 1] as const,
  courseIds: () => [...enrollmentKeys.all, 'course-ids'] as const,
}

export function useMyEnrollments(page = 1) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: enrollmentKeys.my(page),
    queryFn: () => enrollmentService.getMyEnrollments(page),
    placeholderData: (previousData) => previousData,
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

export function useCancelEnrollment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (enrollmentId: string) => enrollmentService.cancelEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
    },
  })
}
