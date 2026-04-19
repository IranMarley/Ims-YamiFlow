'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMyEnrollments, useCancelEnrollment } from '../../hooks/useEnrollments'
import { useAuthStore } from '../../store/authStore'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'

function EnrollmentCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex gap-4">
      <div className="w-14 h-14 skeleton rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-1/2 h-4 skeleton rounded-md" />
        <div className="w-1/3 h-3 skeleton rounded-md" />
        <div className="w-full h-2 skeleton rounded-full mt-3" />
      </div>
      <div className="w-20 h-8 skeleton rounded-xl self-start" />
    </div>
  )
}

export default function MyEnrollmentsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set())
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  // Only students can access My Learning
  if (user?.role && user.role !== 'Student') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-xl font-semibold text-text mb-2">Access restricted</h2>
          <p className="text-subtle">My Learning is only available for students.</p>
        </div>
      </div>
    )
  }

  const { data, isLoading } = useMyEnrollments(page)
  const cancelMutation = useCancelEnrollment()

  const handleCancelConfirm = (enrollmentId: string) => {
    setCancellingId(enrollmentId)
    setConfirmCancelId(null)
    cancelMutation.mutate(enrollmentId, {
      onSuccess: () => {
        setCancelledIds((prev) => new Set(prev).add(enrollmentId))
        setCancellingId(null)
      },
      onError: () => {
        setCancellingId(null)
      },
    })
  }

  const visibleItems = data?.items.filter((e) => !cancelledIds.has(e.enrollmentId)) ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">My Learning</h1>
          <p className="text-subtle mt-1">
            {data
              ? `${data.totalCount - cancelledIds.size} active enrollment${
                  data.totalCount - cancelledIds.size !== 1 ? 's' : ''
                }`
              : 'Track your enrolled courses'}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <EnrollmentCardSkeleton key={i} />)}
          </div>
        ) : visibleItems.length === 0 && !isLoading ? (
          <EmptyState
            title="No enrollments yet"
            description="You haven't enrolled in any courses. Browse our catalog and start learning today."
            action={{
              label: 'Browse Courses',
              onClick: () => router.push('/courses'),
            }}
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />
        ) : (
          <div className="space-y-4">
            {visibleItems.map((enrollment) => {
              const progress = enrollment.totalLessons
                ? Math.round((enrollment.completedLessons / enrollment.totalLessons) * 100)
                : 0
              const isCancelling = cancellingId === enrollment.enrollmentId
              const isConfirming = confirmCancelId === enrollment.enrollmentId

              return (
                <Card key={enrollment.enrollmentId} className="flex flex-col sm:flex-row gap-4">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3
                          className="font-semibold text-text cursor-pointer hover:text-primary transition-colors"
                          onClick={() => router.push(`/courses/${enrollment.courseId}/learn`)}
                        >
                          {enrollment.courseTitle}
                        </h3>
                        <p className="text-xs text-subtle mt-0.5">
                          Enrolled{' '}
                          {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          {enrollment.finalPrice > 0 && (
                            <> · Paid <span className="text-text">${enrollment.finalPrice.toFixed(2)}</span></>
                          )}
                          {enrollment.finalPrice === 0 && <> · Free</>}
                        </p>
                      </div>

                      {/* Cancel confirm flow */}
                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-subtle hidden sm:block">Cancel enrollment?</span>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={isCancelling}
                            onClick={() => handleCancelConfirm(enrollment.enrollmentId)}
                          >
                            Yes, cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmCancelId(null)}
                          >
                            Keep
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={isCancelling}
                          onClick={() => setConfirmCancelId(enrollment.enrollmentId)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-subtle">
                          {enrollment.completedLessons} of {enrollment.totalLessons} lessons
                        </span>
                        <span className="text-xs font-medium text-primary">{progress}%</span>
                      </div>
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Continue button */}
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/courses/${enrollment.courseId}/learn`)}
                      >
                        {progress === 0 ? 'Start Learning' : progress === 100 ? 'Review Course' : 'Continue'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-subtle">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}
      </main>
    </div>
  )
}
