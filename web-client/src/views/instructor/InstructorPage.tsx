'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { useInstructorStats, useInstructorCourses } from '../../hooks/useInstructor'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text">{value}</p>
        <p className="text-sm text-subtle">{label}</p>
      </div>
    </Card>
  )
}

export default function InstructorPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)

  if (user?.role !== 'Instructor' && user?.role !== 'Admin') return null

  const { data: stats, isLoading: loadingStats } = useInstructorStats()
  const { data: courses, isLoading: loadingCourses } = useInstructorCourses(page, 12)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Instructor Dashboard</h1>
          <p className="text-subtle mt-1">Your courses and performance overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {loadingStats ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)
          ) : (
            <>
              <StatCard
                label="Total Courses"
                value={stats?.totalCourses ?? 0}
                color="bg-primary/15 text-primary"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
              />
              <StatCard
                label="Total Students"
                value={stats?.totalStudents ?? 0}
                color="bg-success/15 text-success"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Total Enrollments"
                value={stats?.totalEnrollments ?? 0}
                color="bg-warning/15 text-warning"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <StatCard
                label="Total Revenue"
                value={`$${(stats?.totalRevenue ?? 0).toFixed(2)}`}
                color="bg-danger/15 text-danger"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </>
          )}
        </div>

        {/* My courses */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-text">My Courses</h2>
            <button
              onClick={() => router.push('/instructor/courses/new')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Course
            </button>
          </div>

          {loadingCourses ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : courses?.items.length === 0 ? (
            <EmptyState
              title="No courses yet"
              description="Create your first course to start teaching."
              action={{ label: 'Create course', onClick: () => router.push('/courses') }}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses?.items.map((course) => (
                  <Card key={course.courseId} padding="none">
                    <div className="h-36 rounded-t-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="object-cover w-full h-full" />
                      ) : (
                        <svg className="w-10 h-10 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{['Beginner', 'Intermediate', 'Advanced'][course.level] ?? 'Course'}</Badge>
                          <span className="text-xs text-subtle">{course.publishedAt ? 'Published' : 'Draft'}</span>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                        </span>
                      </div>
                      <h3 className="font-semibold text-text line-clamp-2 mb-1">{course.title}</h3>
                      <p className="text-xs text-subtle mb-2 line-clamp-3">{course.description}</p>
                      <p className="text-xs text-subtle mb-4">
                        {course.enrollmentCount} student{course.enrollmentCount !== 1 ? 's' : ''}
                        {course.publishedAt && (
                          <span className="ml-3 text-xs text-subtle">• Published on {new Date(course.publishedAt).toLocaleDateString()}</span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/instructor/courses/${course.courseId}`)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary-hover transition-colors"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => router.push(`/courses/${course.courseId}`)}
                          className="px-3 py-1.5 rounded-xl border border-border text-subtle text-xs hover:text-text hover:bg-surface-hover transition-colors"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {courses && courses.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 rounded-xl text-sm border border-border bg-surface text-subtle hover:text-text disabled:opacity-40 transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-subtle">
                    Page {page} of {courses.totalPages}
                  </span>
                  <button
                    disabled={page === courses.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 rounded-xl text-sm border border-border bg-surface text-subtle hover:text-text disabled:opacity-40 transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
