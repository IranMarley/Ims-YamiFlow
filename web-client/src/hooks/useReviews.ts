import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewService } from '../services/review.service'

export const reviewKeys = {
  all: ['reviews'] as const,
  byCourse: (courseId: string) => [...reviewKeys.all, courseId] as const,
}

export function useCourseReviews(courseId: string, page = 1, pageSize = 10) {
  return useQuery({
    queryKey: [...reviewKeys.byCourse(courseId), page, pageSize],
    queryFn: () => reviewService.listCourseReviews(courseId, page, pageSize),
    enabled: !!courseId,
  })
}

export function useCreateReview(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      reviewService.createReview(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byCourse(courseId) })
    },
  })
}

export function useDeleteReview(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reviewId: string) => reviewService.deleteReview(courseId, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byCourse(courseId) })
    },
  })
}
