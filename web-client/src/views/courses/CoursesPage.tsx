'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BASE_URL } from '../../lib/axios'
import { useCourses } from '../../hooks/useCourses'
import { useEnroll, useMyEnrolledCourseIds } from '../../hooks/useEnrollments'
import { useSubscription } from '../../hooks/useSubscription'
import { useAuthStore } from '../../store/authStore'
import PublicHeader from '../../components/layout/PublicHeader'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import type { CourseLevel } from '../../types/course'

function CourseCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="h-40 skeleton" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <div className="w-20 h-5 skeleton rounded-full" />
          <div className="w-12 h-5 skeleton rounded-md" />
        </div>
        <div className="w-3/4 h-4 skeleton rounded-md" />
        <div className="w-full h-3 skeleton rounded-md" />
        <div className="w-2/3 h-3 skeleton rounded-md" />
        <div className="w-full h-9 skeleton rounded-xl mt-4" />
      </div>
    </div>
  )
}

const LEVELS: Array<CourseLevel | 'All'> = ['All', 'Beginner', 'Intermediate', 'Advanced']
const PAGE_SIZE = 9

export default function CoursesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const isStudent = !user?.role || user.role === 'Student'

  const enrollMutation = useEnroll()
  const { data: enrolledCourseIds } = useMyEnrolledCourseIds()
  const { data: subscription } = useSubscription()
  const hasActiveSubscription = subscription?.status === 'Active' || subscription?.status === 'Trialing'

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [level, setLevel] = useState<CourseLevel | 'All'>('All')
  const [onlyFree, setOnlyFree] = useState(false)
  const [page, setPage] = useState(1)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  // Debounce search input by 400ms
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(id)
  }, [search])

  const { data, isLoading, isFetching } = useCourses({
    search: debouncedSearch || undefined,
    level: level === 'All' ? undefined : level,
    isFree: onlyFree || undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const enrolledSet = new Set(enrolledCourseIds ?? [])

  const handleEnroll = useCallback(
    (courseId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      setEnrollingId(courseId)
      enrollMutation.mutate(
        { courseId },
        {
          onSuccess: () => setEnrollingId(null),
          onError: () => setEnrollingId(null),
        },
      )
    },
    [enrollMutation],
  )

  const totalPages = data?.totalPages ?? 1

  return (
    <div className="min-h-screen bg-background">
  {user ? <Header /> : <PublicHeader />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Explore Courses</h1>
          <p className="text-subtle mt-1">
            {data ? `${data.totalCount} course${data.totalCount !== 1 ? 's' : ''} available` : 'Browse and enroll in courses'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => { setLevel(l); setPage(1) }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 border cursor-pointer ${
                    level === l
                      ? 'bg-primary/15 text-primary border-primary/30'
                      : 'bg-surface text-subtle border-border hover:text-text hover:border-subtle'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer w-fit">
            <div className="relative">
              <input
                type="checkbox"
                checked={onlyFree}
                onChange={(e) => { setOnlyFree(e.target.checked); setPage(1) }}
                className="sr-only peer"
              />
              <div className={`w-4 h-4 rounded border transition-all ${
                onlyFree
                  ? 'bg-success border-success'
                  : 'bg-surface border-border'
              } peer-focus-visible:ring-2 peer-focus-visible:ring-success peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background`}>
                {onlyFree && (
                  <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-subtle select-none">Free courses only</span>
          </label>
        </div>

        {/* Course grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
          {isLoading ? (
            [...Array(PAGE_SIZE)].map((_, i) => <CourseCardSkeleton key={i} />)
          ) : data?.items.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text">No courses found</h3>
              <p className="text-sm text-subtle mt-1">Try adjusting your search or filter.</p>
            </div>
          ) : (
            data?.items.map((course) => {
              const isEnrolled = enrolledSet.has(course.courseId)
              const isEnrolling = enrollingId === course.courseId

              return (
                <Card
                  key={course.courseId}
                  padding="none"
                  hover
                  onClick={() => router.push(`/courses/${course.courseId}`)}
                >
                  {/* Thumbnail */}
                  <div className="h-40 rounded-t-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={`${BASE_URL}${course.thumbnail}`}
                        alt={course.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="level" level={course.level}>{course.level}</Badge>
                      {course.isFree ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">Free</span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Pro</span>
                      )}
                    </div>

                    <h3 className="font-semibold text-text leading-snug line-clamp-2 mb-1.5">
                      {course.title}
                    </h3>
                    <p className="text-xs text-subtle line-clamp-3 mb-4">
                      {course.description}
                    </p>

                    {(() => {
                      const isFree = course.isFree
                      const canAccess = isFree || hasActiveSubscription

                      if (!user) {
                        return (
                          <Button fullWidth size="sm" variant="secondary"
                            onClick={(e) => { e.stopPropagation(); router.push(`/courses/${course.courseId}`) }}>
                            View Details
                          </Button>
                        )
                      }
                      if (!isStudent) {
                        return (
                          <Button fullWidth size="sm" variant="secondary"
                            onClick={(e) => { e.stopPropagation(); router.push(`/courses/${course.courseId}`) }}>
                            View Details
                          </Button>
                        )
                      }
                      if (isEnrolled) {
                        return (
                          <Button fullWidth size="sm" variant="secondary"
                            onClick={(e) => { e.stopPropagation(); router.push('/enrollments') }}>
                            Continue Learning
                          </Button>
                        )
                      }
                      if (canAccess) {
                        return (
                          <Button fullWidth size="sm" variant="primary" loading={isEnrolling}
                            onClick={(e) => handleEnroll(course.courseId, e)}>
                            {isFree ? 'Enroll Free' : 'Start Learning'}
                          </Button>
                        )
                      }
                      return (
                        <Button fullWidth size="sm" variant="secondary"
                          onClick={(e) => { e.stopPropagation(); router.push('/subscriptions') }}>
                          Subscribe to Access
                        </Button>
                      )
                    })()}
                  </div>
                </Card>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
            >
              Previous
            </Button>

            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1
                if (totalPages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) {
                  if (p === 2 || p === totalPages - 1) {
                    return <span key={p} className="px-2 text-subtle self-end">…</span>
                  }
                  return null
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                      p === page
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-subtle hover:text-text hover:bg-surface'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              rightIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              }
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
