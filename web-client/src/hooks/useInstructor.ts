import { useQuery } from '@tanstack/react-query'
import { instructorService } from '../services/instructor.service'

export const instructorKeys = {
  all: ['instructor'] as const,
  courses: (page: number) => [...instructorKeys.all, 'courses', page] as const,
  stats: () => [...instructorKeys.all, 'stats'] as const,
}

export function useInstructorCourses(page = 1, pageSize = 12) {
  return useQuery({
    queryKey: instructorKeys.courses(page),
    queryFn: () => instructorService.getMyCourses(page, pageSize),
    placeholderData: (prev) => prev,
  })
}

export function useInstructorStats() {
  return useQuery({
    queryKey: instructorKeys.stats(),
    queryFn: () => instructorService.getMyStats(),
  })
}
