'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCourse } from '../../hooks/useCourses'
import { useEnroll, useMyEnrolledCourseIds } from '../../hooks/useEnrollments'
import { useSubscription } from '../../hooks/useSubscription'
import { useAuthStore } from '../../store/authStore'
import PublicHeader from '../../components/layout/PublicHeader'
import Header from '../../components/layout/Header'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { LessonDetail, ModuleDetail } from '../../types/course'

function formatDuration(seconds: number): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const BASE_URL = API_BASE

function PreviewPlayer({ lesson, onClose }: { lesson: LessonDetail; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null)

  useEffect(() => {
    if (!lesson.hasVideo || !videoRef.current) return
    const manifestUrl = `${API_BASE}/api/lessons/${lesson.lessonId}/video/manifest`
    const { accessToken } = useAuthStore.getState()
    let destroyed = false

    import('hls.js').then(({ default: Hls }) => {
      if (destroyed || !videoRef.current) return
      if (Hls.isSupported()) {
        if (hlsRef.current) hlsRef.current.destroy()
        const hls = new Hls({
          xhrSetup: (xhr: XMLHttpRequest) => {
            if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
          },
        })
        hlsRef.current = hls
        hls.loadSource(manifestUrl)
        hls.attachMedia(videoRef.current)
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = manifestUrl
      }
    })

    return () => {
      destroyed = true
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.lessonId])

  const isExternalUrl = lesson.contentUrl?.startsWith('http://') || lesson.contentUrl?.startsWith('https://')

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-primary/30 bg-background">
      {lesson.hasVideo ? (
        <div className="aspect-video bg-black">
          <video ref={videoRef} className="w-full h-full" controls playsInline />
        </div>
      ) : isExternalUrl ? (
        <div className="aspect-video">
          <iframe
            src={lesson.contentUrl!}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            title={lesson.title}
          />
        </div>
      ) : (
        <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 to-background">
          <div className="text-center">
            <svg className="w-10 h-10 text-primary/30 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-subtle text-xs">No preview available</p>
          </div>
        </div>
      )}
      <div className="px-3 py-2 flex items-center justify-between border-t border-border/50">
        <span className="text-xs font-medium text-text">{lesson.title}</span>
        <button onClick={onClose} className="text-xs text-subtle hover:text-text transition-colors">
          Close preview
        </button>
      </div>
    </div>
  )
}

function CurriculumSection({ modules }: { modules: ModuleDetail[] }) {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set([modules[0]?.moduleId]))
  const [previewLesson, setPreviewLesson] = useState<LessonDetail | null>(null)

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const previewCount = modules.flatMap((m) => m.lessons).filter((l) => l.isFreePreview).length

  const toggleModule = (id: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const togglePreview = (lesson: LessonDetail) => {
    setPreviewLesson((prev) => (prev?.lessonId === lesson.lessonId ? null : lesson))
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text">Course Curriculum</h2>
        <span className="text-xs text-subtle">
          {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
          {previewCount > 0 && ` · ${previewCount} free preview${previewCount !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div className="space-y-2">
        {modules.map((mod) => {
          const isOpen = openModules.has(mod.moduleId)
          const modDuration = mod.lessons.reduce((s, l) => s + (l.durationSeconds ?? 0), 0)

          return (
            <div key={mod.moduleId} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleModule(mod.moduleId)}
                className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-hover transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg className={`w-4 h-4 text-subtle shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-sm font-medium text-text truncate">{mod.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-xs text-subtle">{mod.lessons.length} lessons</span>
                  {modDuration > 0 && <span className="text-xs text-subtle">{formatDuration(modDuration)}</span>}
                </div>
              </button>

              {isOpen && (
                <div className="divide-y divide-border/50">
                  {mod.lessons.map((lesson) => {
                    const isActive = previewLesson?.lessonId === lesson.lessonId
                    return (
                      <div key={lesson.lessonId} className="bg-background/50">
                        <div className="flex items-center gap-3 px-4 py-2.5">
                          <span className="shrink-0">
                            {lesson.isFreePreview ? (
                              <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-subtle/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            )}
                          </span>
                          <span className="flex-1 text-xs text-text truncate">{lesson.title}</span>
                          {lesson.durationSeconds > 0 && (
                            <span className="text-xs text-subtle shrink-0">{formatDuration(lesson.durationSeconds)}</span>
                          )}
                          {lesson.isFreePreview && (
                            <button
                              onClick={() => togglePreview(lesson)}
                              className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                                isActive ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10 border border-primary/30'
                              }`}
                            >
                              {isActive ? 'Close' : 'Preview'}
                            </button>
                          )}
                        </div>
                        {isActive && (
                          <div className="px-4 pb-3">
                            <PreviewPlayer lesson={lesson} onClose={() => setPreviewLesson(null)} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default function CourseDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { user } = useAuthStore()
  const enrollMutation = useEnroll()
  const { data: enrolledIds } = useMyEnrolledCourseIds()
  const { data: subscription } = useSubscription()

  const isStudent = !user?.role || user.role === 'Student'
  const isAlreadyEnrolled = enrolledIds?.includes(id ?? '') ?? false
  const hasActiveSubscription = subscription?.isActive ?? false

  const [enrollError, setEnrollError] = useState<string | null>(null)

  const { data: course, isLoading, isError } = useCourse(id ?? '')

  const handleEnroll = () => {
    if (!id) return
    setEnrollError(null)
    enrollMutation.mutate(
      { courseId: id },
      {
        onSuccess: () => router.push(`/courses/${id}/learn`),
        onError: (err) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Could not enroll in this course. Please try again.'
          setEnrollError(msg)
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="flex items-center justify-center py-32"><Spinner size="lg" /></div>
      </div>
    )
  }

  if (isError || !course) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-semibold text-text">Course not found</h2>
          <p className="text-sm text-subtle mt-2 mb-6">This course may have been removed or the link is incorrect.</p>
          <Button onClick={() => router.push('/courses')}>Browse Courses</Button>
        </div>
      </div>
    )
  }

  const modules: ModuleDetail[] = course.modules ?? []
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const isFree = course.isFree

  // Access logic
  const canAccessNow = isFree || hasActiveSubscription || isAlreadyEnrolled

  return (
    <div className="min-h-screen bg-background">
      {user ? <Header /> : <PublicHeader />}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="flex items-center gap-2 text-sm text-subtle mb-6">
          <Link href="/courses" className="hover:text-text transition-colors">Courses</Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-text truncate max-w-xs">{course.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-56 sm:h-72 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-background border border-border flex items-center justify-center overflow-hidden">
              {course.thumbnail ? (
                <img
                  src={`${BASE_URL}${course.thumbnail}`}
                  alt={course.title}
                  className="object-cover w-full h-full"
                />
              ) : (
                <svg className="w-16 h-16 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge variant="level" level={course.level}>{course.level}</Badge>
                {isFree && <Badge variant="success">Free</Badge>}
                {!isFree && <Badge variant="primary">Premium</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-text leading-tight">{course.title}</h1>
              {course.instructorName && (
                <p className="text-sm text-subtle mt-2">by {course.instructorName}</p>
              )}
              {course.enrollmentCount != null && course.enrollmentCount > 0 && (
                <p className="text-xs text-subtle mt-1">{course.enrollmentCount.toLocaleString()} students enrolled</p>
              )}
            </div>

            <Card>
              <h2 className="text-lg font-semibold text-text mb-3">About this course</h2>
              <p className="text-subtle text-sm leading-relaxed whitespace-pre-line">{course.description}</p>
            </Card>

            {modules.length > 0 && <CurriculumSection modules={modules} />}

          </div>

          {/* Enrollment / access card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="space-y-5">
                {/* Price badge */}
                <div className="text-center">
                  {isFree ? (
                    <p className="text-4xl font-bold text-success">Free</p>
                  ) : hasActiveSubscription ? (
                    <>
                      <p className="text-sm font-medium text-primary mb-1">Included in your subscription</p>
                      <p className="text-xs text-subtle">Access all premium courses</p>
                    </>
                  ) : (
                    <>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                        </svg>
                        <span className="text-xs font-semibold text-primary">Premium Course</span>
                      </div>
                      <p className="text-sm text-subtle">Subscribe to access all premium courses</p>
                    </>
                  )}
                </div>

                {/* Not logged in */}
                {!user ? (
                  <div className="space-y-3">
                    <Link
                      href="/register"
                      className="flex items-center justify-center w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl transition-colors"
                    >
                      {isFree ? 'Sign up & Enroll for Free' : 'Sign up to Subscribe'}
                    </Link>
                    <p className="text-center text-xs text-subtle">
                      Already have an account?{' '}
                      <Link href="/login" className="text-primary hover:text-primary-hover transition-colors font-medium">
                        Log in
                      </Link>
                    </p>
                  </div>
                ) : canAccessNow && (isAlreadyEnrolled || enrollMutation.isSuccess) ? (
                  /* Already enrolled */
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-success/10 border border-success/20 px-4 py-3">
                      <svg className="w-5 h-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-success">You&apos;re enrolled!</p>
                        <p className="text-xs text-subtle">You have full access to this course.</p>
                      </div>
                    </div>
                    <Button fullWidth variant="secondary" onClick={() => router.push(`/courses/${id}/learn`)}>
                      Continue Learning
                    </Button>
                  </div>
                ) : !isStudent ? (
                  <p className="text-sm text-subtle text-center py-2">Only students can enroll in courses.</p>
                ) : isFree ? (
                  /* Free course — enroll directly */
                  <>
                    {enrollError && (
                      <div className="rounded-xl bg-danger/10 border border-danger/20 px-3 py-2.5 text-xs text-danger">
                        {enrollError}
                      </div>
                    )}
                    <Button fullWidth size="lg" loading={enrollMutation.isPending} onClick={handleEnroll}>
                      Enroll for Free
                    </Button>
                  </>
                ) : hasActiveSubscription ? (
                  /* Has subscription → enroll now */
                  <>
                    {enrollError && (
                      <div className="rounded-xl bg-danger/10 border border-danger/20 px-3 py-2.5 text-xs text-danger">
                        {enrollError}
                      </div>
                    )}
                    <Button fullWidth size="lg" loading={enrollMutation.isPending} onClick={handleEnroll}>
                      Start Learning
                    </Button>
                  </>
                ) : (
                  /* No subscription — prompt to subscribe */
                  <div className="space-y-3">
                    <Button fullWidth size="lg" onClick={() => router.push('/subscriptions')}>
                      Subscribe to Access
                    </Button>
                    <p className="text-center text-xs text-subtle">
                      Get unlimited access to all premium courses
                    </p>
                  </div>
                )}

                {/* Quick facts */}
                <div className="border-t border-border pt-4 space-y-2">
                  {[
                    { icon: '📚', label: 'Level', value: course.level },
                    ...(totalLessons > 0 ? [{ icon: '🎬', label: 'Lessons', value: `${totalLessons} lessons` }] : []),
                    { icon: '🎓', label: 'Certificate', value: 'On completion' },
                    { icon: '♾️', label: 'Access', value: isFree ? 'Free forever' : 'With subscription' },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-subtle flex items-center gap-1.5"><span>{icon}</span> {label}</span>
                      <span className="text-text font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
