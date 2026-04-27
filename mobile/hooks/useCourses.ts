import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { courseService } from '../services/course.service'
import type { CourseListParams } from '../types/course'

export const courseKeys = {
  all: ['courses'] as const,
  list: (params: Omit<CourseListParams, 'page'>) => [...courseKeys.all, 'list', params] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
}

export function useCourses(params: Omit<CourseListParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: courseKeys.list(params),
    queryFn: ({ pageParam }) => courseService.listCourses({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => courseService.getCourse(id),
    enabled: !!id,
  })
}
