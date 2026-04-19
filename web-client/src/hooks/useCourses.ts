import { useQuery } from '@tanstack/react-query'
import { courseService } from '../services/course.service'
import type { CourseListParams } from '../types/course'

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params: CourseListParams) => [...courseKeys.lists(), params] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
}

export function useCourses(params: CourseListParams = {}) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: () => courseService.listCourses(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => courseService.getCourse(id),
    enabled: !!id,
  })
}
