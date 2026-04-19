'use client'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { useMyEnrollments } from '../../hooks/useEnrollments'
import { useCourses } from '../../hooks/useCourses'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

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

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  const { data: enrollments, isLoading: loadingEnrollments } = useMyEnrollments(1)
  const { data: courses, isLoading: loadingCourses } = useCourses({ pageSize: 3 })

  const enrolledCount = enrollments?.totalCount ?? 0
  const completedLessons = enrollments?.items.reduce(
    (sum, e) => sum + (e.completedLessons ?? 0),
    0,
  ) ?? 0

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-subtle mt-1">
            {enrolledCount > 0
              ? `You're enrolled in ${enrolledCount} course${enrolledCount !== 1 ? 's' : ''}. Keep going!`
              : 'Ready to start your learning journey? Browse our courses below.'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {loadingEnrollments ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 skeleton rounded-2xl" />
              ))}
            </>
          ) : (
            <>
              <StatCard
                label="Enrolled Courses"
                value={enrolledCount}
                color="bg-primary/15 text-primary"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
              />
              <StatCard
                label="Lessons Completed"
                value={completedLessons}
                color="bg-success/15 text-success"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Available Courses"
                value={loadingCourses ? '—' : (courses?.totalCount ?? 0)}
                color="bg-warning/15 text-warning"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
              />
            </>
          )}
        </div>

        {/* Featured courses */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-text">Featured Courses</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/courses')}>
              View all
            </Button>
          </div>

          {loadingCourses ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses?.items.map((course) => (
                <Card
                  key={course.courseId}
                  hover
                  padding="none"
                  onClick={() => router.push(`/courses/${course.courseId}`)}
                >
                  {/* Thumbnail placeholder */}
                  <div className="h-36 rounded-t-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="level" level={course.level}>{course.level}</Badge>
                      <span className="text-sm font-semibold text-primary">
                        {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                      </span>
                    </div>
                    <h3 className="font-semibold text-text line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-subtle mt-1 line-clamp-2">{course.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Recent enrollments */}
        {enrollments && enrollments.items.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-text">Continue Learning</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push('/enrollments/my')}>
                See all
              </Button>
            </div>

            <div className="space-y-3">
              {enrollments.items.slice(0, 3).map((enrollment) => (
                <Card
                  key={enrollment.enrollmentId}
                  hover
                  className="flex items-center gap-4"
                  onClick={() => router.push(`/courses/${enrollment.courseId}`)}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{enrollment.courseTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${enrollment.totalLessons
                              ? Math.round(((enrollment.completedLessons ?? 0) / enrollment.totalLessons) * 100)
                              : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-subtle shrink-0">
                        {enrollment.totalLessons
                          ? `${Math.round(((enrollment.completedLessons ?? 0) / enrollment.totalLessons) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
